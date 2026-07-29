// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { errorMessage, writeSecureFile } from '@google-github-actions/actions-utils';

import { AuthClient, Client, ClientParameters } from './client';

const STS_MAX_ATTEMPTS = 4;
const STS_RETRY_BACKOFF_MILLISECONDS = 500;
const RETRYABLE_STS_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const RETRYABLE_CONNECTION_ERROR_CODES = new Set(['EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT']);

interface STSFailure {
  readonly status?: number;
  readonly errorClass: string;
  readonly responseMessage?: string;
  readonly retryable: boolean;
}

function errorCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') {
    return undefined;
  }

  const candidate = err as { code?: unknown; cause?: { code?: unknown } };
  if (typeof candidate.code === 'string') {
    return candidate.code;
  }
  if (typeof candidate.cause?.code === 'string') {
    return candidate.cause.code;
  }
  return undefined;
}

function classifySTSFailure(err: unknown): STSFailure {
  if (err && typeof err === 'object') {
    const candidate = err as { statusCode?: unknown; result?: unknown };
    const status = candidate.statusCode;
    if (typeof status === 'number') {
      const result =
        candidate.result && typeof candidate.result === 'object'
          ? (candidate.result as {
              error_description?: unknown;
              error?: { message?: unknown };
            })
          : undefined;
      const responseMessage = result?.error_description || result?.error?.message;
      return {
        status,
        errorClass: RETRYABLE_STS_STATUS_CODES.has(status)
          ? 'transient_http_response'
          : 'non_retryable_http_response',
        responseMessage:
          typeof responseMessage === 'string'
            ? responseMessage.replace(/[\r\n]+/g, ' ').trim() || undefined
            : undefined,
        retryable: RETRYABLE_STS_STATUS_CODES.has(status),
      };
    }
  }

  const code = errorCode(err);
  if (code && RETRYABLE_CONNECTION_ERROR_CODES.has(code)) {
    return {
      errorClass: code,
      retryable: true,
    };
  }

  // @actions/http-client emits an uncoded error when its socket timeout fires.
  if (err instanceof Error && err.message.startsWith('Request timeout:')) {
    return {
      errorClass: 'request_timeout',
      retryable: true,
    };
  }

  return {
    errorClass: 'non_retryable_error',
    retryable: false,
  };
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * WorkloadIdentityFederationClientParameters is used as input to the
 * WorkloadIdentityFederationClient.
 */
export interface WorkloadIdentityFederationClientParameters extends ClientParameters {
  readonly githubOIDCToken: string;
  readonly githubOIDCTokenRequestURL: string;
  readonly githubOIDCTokenRequestToken: string;
  readonly githubOIDCTokenAudience: string;
  readonly workloadIdentityProviderName: string;
  readonly audience?: string;
  readonly serviceAccount?: string;
}

/**
 * WorkloadIdentityFederationClient is an authentication client that configures
 * a Workload Identity authentication scheme.
 */
export class WorkloadIdentityFederationClient extends Client implements AuthClient {
  readonly #githubOIDCToken: string;
  readonly #githubOIDCTokenRequestURL: string;
  readonly #githubOIDCTokenRequestToken: string;
  readonly #githubOIDCTokenAudience: string;
  readonly #workloadIdentityProviderName: string;
  readonly #serviceAccount?: string;
  readonly #audience: string;

  #cachedToken?: string;
  #cachedAt?: number;

  constructor(opts: WorkloadIdentityFederationClientParameters) {
    super('WorkloadIdentityFederationClient', opts);

    this.#githubOIDCToken = opts.githubOIDCToken;
    this.#githubOIDCTokenRequestURL = opts.githubOIDCTokenRequestURL;
    this.#githubOIDCTokenRequestToken = opts.githubOIDCTokenRequestToken;
    this.#githubOIDCTokenAudience = opts.githubOIDCTokenAudience;
    this.#workloadIdentityProviderName = opts.workloadIdentityProviderName;
    this.#serviceAccount = opts.serviceAccount;

    const iamHost = new URL(this._endpoints.iam).host;
    this.#audience = `//${iamHost}/${this.#workloadIdentityProviderName}`;
  }

  /**
   * getToken gets a Google Cloud Federated Token that can call other Google
   * Cloud APIs directly or impersonate an existing Service Account. Direct
   * Workload Identity Federation will use the Federated Token directly.
   * Workload Identity Federation through a Service Account will use
   * impersonation.
   */
  async getToken(): Promise<string> {
    const logger = this._logger.withNamespace(`getToken`);

    const now = new Date().getTime();
    if (this.#cachedToken && this.#cachedAt && now - this.#cachedAt < 30_000) {
      logger.debug(`Using cached token`, {
        now: now,
        cachedAt: this.#cachedAt,
      });
      return this.#cachedToken;
    }

    const pth = `${this._endpoints.sts}/token`;

    const headers = Object.assign(this._headers(), {});

    const body = {
      audience: this.#audience,
      grantType: `urn:ietf:params:oauth:grant-type:token-exchange`,
      requestedTokenType: `urn:ietf:params:oauth:token-type:access_token`,
      scope: `${this._endpoints.www}/auth/cloud-platform`,
      subjectTokenType: `urn:ietf:params:oauth:token-type:jwt`,
      subjectToken: this.#githubOIDCToken,
    };

    const endpoint = new URL(pth).hostname;
    for (let attempt = 1; attempt <= STS_MAX_ATTEMPTS; attempt++) {
      try {
        const resp = await this._httpClient.postJson<{ access_token: string }>(pth, body, headers);
        const statusCode = resp.statusCode || 500;
        if (statusCode < 200 || statusCode > 299) {
          const err = new Error(`STS token exchange returned HTTP ${statusCode}`);
          Object.assign(err, { statusCode, result: resp.result });
          throw err;
        }

        const result = resp.result;
        if (!result) {
          throw new Error(`STS token exchange returned an empty result`);
        }

        this.#cachedToken = result.access_token;
        this.#cachedAt = now;
        return result.access_token;
      } catch (err) {
        const failure = classifySTSFailure(err);
        const status = failure.status ?? 'none';
        logger.warning(
          `STS request failed: operation=token_exchange, endpoint_class=${endpoint}, ` +
            `status=${status}, error_class=${failure.errorClass}, ` +
            `attempt=${attempt}/${STS_MAX_ATTEMPTS}`,
        );

        if (!failure.retryable || attempt === STS_MAX_ATTEMPTS) {
          const responseMessage = failure.responseMessage
            ? `, response_message=${failure.responseMessage}`
            : '';
          throw new Error(
            `Failed to generate Google Cloud federated token: operation=token_exchange, ` +
              `endpoint_class=${endpoint}, status=${status}, ` +
              `error_class=${failure.errorClass}, attempt=${attempt}/${STS_MAX_ATTEMPTS}` +
              responseMessage,
          );
        }

        await sleep(STS_RETRY_BACKOFF_MILLISECONDS * 2 ** (attempt - 1));
      }
    }

    throw new Error(`STS token exchange failed unexpectedly`);
  }

  /**
   * signJWT signs a JWT using the Service Account's private key.
   */
  async signJWT(claims: any): Promise<string> {
    const logger = this._logger.withNamespace(`signJWT`);

    if (!this.#serviceAccount) {
      throw new Error(`Cannot sign JWTs without specifying a service account`);
    }

    const pth = `${this._endpoints.iamcredentials}/projects/-/serviceAccounts/${this.#serviceAccount}:signJwt`;

    const headers = Object.assign(this._headers(), {
      Authorization: `Bearer ${await this.getToken()}`,
    });

    const body = {
      payload: claims,
    };

    logger.debug(`Built request`, {
      method: `POST`,
      path: pth,
      headers: headers,
      body: body,
    });

    try {
      const resp = await this._httpClient.postJson<{ signedJwt: string }>(pth, body, headers);
      const statusCode = resp.statusCode || 500;
      if (statusCode < 200 || statusCode > 299) {
        throw new Error(`Failed to call ${pth}: HTTP ${statusCode}: ${resp.result || '[no body]'}`);
      }

      const result = resp.result;
      if (!result) {
        throw new Error(`Successfully called ${pth}, but the result was empty`);
      }
      return result.signedJwt;
    } catch (err) {
      const msg = errorMessage(err);
      throw new Error(`Failed to sign JWT using ${this.#serviceAccount}: ${msg}`);
    }
  }

  /**
   * createCredentialsFile writes a Workload Identity Federation credential file
   * to disk at the specific outputPath.
   */
  async createCredentialsFile(outputPath: string): Promise<string> {
    const logger = this._logger.withNamespace(`createCredentialsFile`);

    const requestURL = new URL(this.#githubOIDCTokenRequestURL);

    // Append the audience value to the request.
    const params = requestURL.searchParams;
    params.set('audience', this.#githubOIDCTokenAudience);
    requestURL.search = params.toString();

    const data: Record<string, any> = {
      type: `external_account`,
      audience: this.#audience,
      subject_token_type: `urn:ietf:params:oauth:token-type:jwt`,
      token_url: `${this._endpoints.sts}/token`,
      credential_source: {
        url: requestURL,
        headers: {
          Authorization: `Bearer ${this.#githubOIDCTokenRequestToken}`,
        },
        format: {
          type: `json`,
          subject_token_field_name: `value`,
        },
      },
    };

    // Only request impersonation if a service account was given, otherwise use
    // the WIF identity directly.
    if (this.#serviceAccount) {
      const impersonationURL = `${this._endpoints.iamcredentials}/projects/-/serviceAccounts/${this.#serviceAccount}:generateAccessToken`;
      logger.debug(`Enabling service account impersonation via ${impersonationURL}`);
      data.service_account_impersonation_url = impersonationURL;
    }

    logger.debug(`Creating credentials`, {
      outputPath: outputPath,
    });

    return await writeSecureFile(outputPath, JSON.stringify(data));
  }
}
