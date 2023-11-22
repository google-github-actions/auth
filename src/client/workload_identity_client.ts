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

import { HttpClient } from '@actions/http-client';

import { writeSecureFile } from '@google-github-actions/actions-utils';

import { AuthClient } from './auth_client';
import { expandEndpoint, userAgent } from '../utils';
import { Logger } from '../logger';

/**
 * WorkloadIdentityFederationClientParameters is used as input to the
 * WorkloadIdentityFederationClient.
 */
export interface WorkloadIdentityFederationClientParameters {
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
export class WorkloadIdentityFederationClient implements AuthClient {
  readonly #logger: Logger;
  readonly #httpClient: HttpClient;

  readonly #githubOIDCToken: string;
  readonly #githubOIDCTokenRequestURL: string;
  readonly #githubOIDCTokenRequestToken: string;
  readonly #githubOIDCTokenAudience: string;
  readonly #workloadIdentityProviderName: string;
  readonly #serviceAccount?: string;

  #cachedToken?: string;
  #cachedAt?: number;

  readonly #universe: string = 'googleapis.com';
  readonly #endpoints = {
    iam: 'https://iam.{universe}/v1',
    iamcredentials: 'https://iamcredentials.{universe}/v1',
    sts: 'https://sts.{universe}/v1',
    www: 'https://www.{universe}',
  };
  readonly #audience: string;

  constructor(logger: Logger, opts: WorkloadIdentityFederationClientParameters) {
    this.#logger = logger.withNamespace(this.constructor.name);
    this.#httpClient = new HttpClient(userAgent);

    this.#githubOIDCToken = opts.githubOIDCToken;
    this.#githubOIDCTokenRequestURL = opts.githubOIDCTokenRequestURL;
    this.#githubOIDCTokenRequestToken = opts.githubOIDCTokenRequestToken;
    this.#githubOIDCTokenAudience = opts.githubOIDCTokenAudience;
    this.#workloadIdentityProviderName = opts.workloadIdentityProviderName;
    this.#serviceAccount = opts.serviceAccount;

    const endpoints = this.#endpoints;
    for (const key of Object.keys(this.#endpoints) as Array<keyof typeof endpoints>) {
      this.#endpoints[key] = expandEndpoint(this.#endpoints[key], this.#universe);
    }
    this.#logger.debug(`Computed endpoints`, this.#endpoints);

    const iamHost = new URL(this.#endpoints.iam).host;
    this.#audience = `//${iamHost}/${this.#workloadIdentityProviderName}`;
    this.#logger.debug(`Computed audience`, this.#audience);
  }

  /**
   * getToken gets a Google Cloud Federated Token that can call other Google
   * Cloud APIs directly or impersonate an existing Service Account. Direct
   * Workload Identity Federation will use the Federated Token directly.
   * Workload Identity Federation through a Service Account will use
   * impersonation.
   */
  async getToken(): Promise<string> {
    const now = new Date().getTime();
    if (this.#cachedToken && this.#cachedAt && now - this.#cachedAt > 60_000) {
      this.#logger.debug(`Using cached token`);
      return this.#cachedToken;
    }

    const pth = `${this.#endpoints.sts}/token`;

    const body = {
      audience: this.#audience,
      grantType: `urn:ietf:params:oauth:grant-type:token-exchange`,
      requestedTokenType: `urn:ietf:params:oauth:token-type:access_token`,
      scope: `${this.#endpoints.www}/auth/cloud-platform`,
      subjectTokenType: `urn:ietf:params:oauth:token-type:jwt`,
      subjectToken: this.#githubOIDCToken,
    };

    this.#logger.withNamespace('getToken').debug({
      method: `POST`,
      path: pth,
      body: body,
    });

    try {
      const resp = await this.#httpClient.postJson<{ access_token: string }>(pth, body);
      const statusCode = resp.statusCode || 500;
      if (statusCode < 200 || statusCode > 299) {
        throw new Error(`Failed to call ${pth}: HTTP ${statusCode}: ${resp.result || '[no body]'}`);
      }

      const result = resp.result;
      if (!result) {
        throw new Error(`Successfully called ${pth}, but the result was empty`);
      }

      this.#cachedToken = result.access_token;
      this.#cachedAt = now;
      return result.access_token;
    } catch (err) {
      throw new Error(
        `Failed to generate Google Cloud federated token for ${this.#audience}: ${err}`,
      );
    }
  }

  /**
   * signJWT signs a JWT using the Service Account's private key.
   */
  async signJWT(claims: any): Promise<string> {
    if (!this.#serviceAccount) {
      throw new Error(`Cannot sign JWTs without specifying a service account`);
    }

    const pth = `${this.#endpoints.iamcredentials}/projects/-/serviceAccounts/${this.#serviceAccount}:signJwt`;

    const headers = {
      Authorization: `Bearer ${this.getToken()}`,
    };

    const body = {
      payload: claims,
    };

    this.#logger.withNamespace('signJWT').debug({
      method: `POST`,
      path: pth,
      headers: headers,
      body: body,
    });

    try {
      const resp = await this.#httpClient.postJson<{ signedJwt: string }>(pth, body, headers);
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
      throw new Error(`Failed to sign JWT using ${this.#serviceAccount}: ${err}`);
    }
  }

  /**
   * createCredentialsFile writes a Workload Identity Federation credential file
   * to disk at the specific outputPath.
   */
  async createCredentialsFile(outputPath: string): Promise<string> {
    const requestURL = new URL(this.#githubOIDCTokenRequestURL);

    // Append the audience value to the request.
    const params = requestURL.searchParams;
    params.set('audience', this.#githubOIDCTokenAudience);
    requestURL.search = params.toString();

    const data: Record<string, any> = {
      type: `external_account`,
      audience: this.#audience,
      subject_token_type: `urn:ietf:params:oauth:token-type:jwt`,
      token_url: `${this.#endpoints.sts}/token`,
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
      data.service_account_impersonation_url = `${this.#endpoints.iamcredentials}/projects/-/serviceAccounts/${this.#serviceAccount}:generateAccessToken`;
    }

    this.#logger.withNamespace('createCredentialsFile').debug({ outputPath: outputPath });
    return await writeSecureFile(outputPath, JSON.stringify(data));
  }
}
