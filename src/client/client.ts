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

import { expandUniverseEndpoints } from '@google-github-actions/actions-utils';

import { Logger } from '../logger';
import { userAgent } from '../utils';

/**
 * AuthClient is the default HTTP client for interacting with the IAM credentials
 * API.
 */
export interface AuthClient {
  /**
   * getToken() gets or generates the best token for the auth client.
   */
  getToken(): Promise<string>;

  /**
   * createCredentialsFile creates a credential file (for use with gcloud and
   * other Google Cloud tools) that instructs the tool how to perform identity
   * federation.
   */
  createCredentialsFile(outputPath: string): Promise<string>; // eslint-disable-line no-unused-vars

  /**
   * signJWT signs a JWT using the auth provider.
   */
  signJWT(claims: any): Promise<string>; // eslint-disable-line no-unused-vars
}

export interface ClientParameters {
  logger: Logger;
  universe: string;
  requestReason?: string;
}

export abstract class Client {
  protected readonly _logger: Logger;
  protected readonly _httpClient: HttpClient;
  private readonly _requestReason: string | undefined;

  protected readonly _endpoints = {
    iam: 'https://iam.{universe}/v1',
    iamcredentials: 'https://iamcredentials.{universe}/v1',
    oauth2: 'https://oauth2.{universe}',
    sts: 'https://sts.{universe}/v1',
    www: 'https://www.{universe}',
  };

  constructor(child: string, opts: ClientParameters) {
    this._logger = opts.logger.withNamespace(child);

    // Create the http client with our user agent.
    this._httpClient = new HttpClient(userAgent, undefined, {
      allowRedirects: true,
      allowRetries: true,
      keepAlive: true,
      maxRedirects: 5,
      maxRetries: 3,
    });

    this._endpoints = expandUniverseEndpoints(this._endpoints, opts.universe);
    this._requestReason = opts.requestReason;
  }

  /**
   * _headers returns any added headers to apply to HTTP API calls.
   */
  protected _headers(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this._requestReason) {
      headers['X-Goog-Request-Reason'] = this._requestReason;
    }
    return headers;
  }
}
export { IAMCredentialsClient, IAMCredentialsClientParameters } from './iamcredentials';

export {
  ServiceAccountKeyClient,
  ServiceAccountKeyClientParameters,
} from './service_account_key_json';

export {
  WorkloadIdentityFederationClient,
  WorkloadIdentityFederationClientParameters,
} from './workload_identity_federation';
