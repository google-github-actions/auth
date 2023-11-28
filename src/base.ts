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

import { URLSearchParams } from 'url';

import { HttpClient } from '@actions/http-client';

import { Logger } from './logger';
import { expandEndpoint, userAgent } from './utils';

/**
 * GenerateAccessTokenParameters are the inputs to the generateAccessToken call.
 */
export interface GenerateAccessTokenParameters {
  readonly serviceAccount: string;
  readonly delegates?: string[];
  readonly scopes?: string[];
  readonly lifetime?: number;
}

/**
 * GenerateIDTokenParameters are the inputs to the generateIDToken call.
 */
export interface GenerateIDTokenParameters {
  readonly serviceAccount: string;
  readonly audience: string;
  readonly delegates?: string[];
  readonly includeEmail?: boolean;
}

/**
 * IAMCredentialsClientParameters are the inputs to the IAM client.
 */
export interface IAMCredentialsClientParameters {
  readonly authToken: string;
}

/**
 * IAMCredentialsClient is a thin HTTP client around the Google Cloud IAM
 * Credentials API.
 */
export class IAMCredentialsClient {
  readonly #logger: Logger;
  readonly #httpClient: HttpClient;
  readonly #authToken: string;

  readonly #universe: string = 'googleapis.com';
  readonly #endpoints = {
    iamcredentials: 'https://iamcredentials.{universe}/v1',
    oauth2: 'https://oauth2.{universe}',
  };

  constructor(logger: Logger, opts: IAMCredentialsClientParameters) {
    this.#logger = logger.withNamespace(this.constructor.name);
    this.#httpClient = new HttpClient(userAgent);

    this.#authToken = opts.authToken;

    const endpoints = this.#endpoints;
    for (const key of Object.keys(this.#endpoints) as Array<keyof typeof endpoints>) {
      this.#endpoints[key] = expandEndpoint(this.#endpoints[key], this.#universe);
    }
    this.#logger.debug(`Computed endpoints`, this.#endpoints);
  }

  /**
   * generateAccessToken generates a new OAuth 2.0 Access Token for a service
   * account.
   */
  async generateAccessToken({
    serviceAccount,
    delegates,
    scopes,
    lifetime,
  }: GenerateAccessTokenParameters): Promise<string> {
    const pth = `${this.#endpoints.iamcredentials}/projects/-/serviceAccounts/${serviceAccount}:generateAccessToken`;

    const headers = { Authorization: `Bearer ${this.#authToken}` };

    const body: Record<string, string | Array<string>> = {};
    if (delegates && delegates.length > 0) {
      body.delegates = delegates;
    }
    if (scopes && scopes.length > 0) {
      // Not a typo, the API expects the field to be "scope" (singular).
      body.scope = scopes;
    }
    if (lifetime && lifetime > 0) {
      body.lifetime = `${lifetime}s`;
    }

    this.#logger.withNamespace('generateAccessToken').debug({
      method: `POST`,
      path: pth,
      headers: headers,
      body: body,
    });

    try {
      const resp = await this.#httpClient.postJson<{ accessToken: string }>(pth, body, headers);
      const statusCode = resp.statusCode || 500;
      if (statusCode < 200 || statusCode > 299) {
        throw new Error(`Failed to call ${pth}: HTTP ${statusCode}: ${resp.result || '[no body]'}`);
      }

      const result = resp.result;
      if (!result) {
        throw new Error(`Successfully called ${pth}, but the result was empty`);
      }
      return result.accessToken;
    } catch (err) {
      throw new Error(
        `Failed to generate Google Cloud OAuth 2.0 Access Token for ${serviceAccount}: ${err}`,
      );
    }
  }

  async generateDomainWideDelegationAccessToken(assertion: string): Promise<string> {
    const pth = `${this.#endpoints.oauth2}/token`;

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const body = new URLSearchParams();
    body.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    body.append('assertion', assertion);

    this.#logger.withNamespace('generateDomainWideDelegationAccessToken').debug({
      method: `POST`,
      path: pth,
      headers: headers,
      body: body,
    });

    try {
      const resp = await this.#httpClient.post(pth, body.toString(), headers);
      const respBody = await resp.readBody();
      const statusCode = resp.message.statusCode || 500;
      if (statusCode < 200 || statusCode > 299) {
        throw new Error(`Failed to call ${pth}: HTTP ${statusCode}: ${respBody || '[no body]'}`);
      }
      const parsed = JSON.parse(respBody) as { accessToken: string };
      return parsed.accessToken;
    } catch (err) {
      throw new Error(
        `Failed to generate Google Cloud Domain Wide Delegation OAuth 2.0 Access Token: ${err}`,
      );
    }
  }

  /**
   * generateIDToken generates a new OpenID Connect ID token for a service
   * account.
   */
  async generateIDToken({
    serviceAccount,
    audience,
    delegates,
    includeEmail,
  }: GenerateIDTokenParameters): Promise<string> {
    const pth = `${this.#endpoints.iamcredentials}/projects/-/serviceAccounts/${serviceAccount}:generateIdToken`;

    const headers = { Authorization: `Bearer ${this.#authToken}` };

    const body: Record<string, string | string[] | boolean> = {
      audience: audience,
      includeEmail: includeEmail ? true : false,
    };
    if (delegates && delegates.length > 0) {
      body.delegates = delegates;
    }

    this.#logger.withNamespace('generateIDToken').debug({
      method: `POST`,
      path: pth,
      headers: headers,
      body: body,
    });

    try {
      const resp = await this.#httpClient.postJson<{ token: string }>(pth, body, headers);
      const statusCode = resp.statusCode || 500;
      if (statusCode < 200 || statusCode > 299) {
        throw new Error(`Failed to call ${pth}: HTTP ${statusCode}: ${resp.result || '[no body]'}`);
      }

      const result = resp.result;
      if (!result) {
        throw new Error(`Successfully called ${pth}, but the result was empty`);
      }
      return result.token;
    } catch (err) {
      throw new Error(
        `Failed to generate Google Cloud OpenID Connect ID token for ${serviceAccount}: ${err}`,
      );
    }
  }
}

export { AuthClient } from './client/auth_client';
export {
  ServiceAccountKeyClientParameters,
  ServiceAccountKeyClient,
} from './client/credentials_json_client';
export {
  WorkloadIdentityFederationClientParameters,
  WorkloadIdentityFederationClient,
} from './client/workload_identity_client';
