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

/**
 * Defines the main interface for all clients that generate credentials.
 */
export interface AuthClient {
  getAuthToken(): Promise<string>;
  signJWT(unsignedJWT: string, delegates?: Array<string>): Promise<string>;
  getProjectID(): Promise<string>;
  getServiceAccount(): Promise<string>;
  createCredentialsFile(outputDir: string): Promise<string>;

  /**
   * Provided by BaseClient.
   */
  googleIDToken(token: string, params: GoogleIDTokenParameters): Promise<GoogleIDTokenResponse>;
  googleAccessToken(
    token: string,
    params: GoogleAccessTokenParameters,
  ): Promise<GoogleAccessTokenResponse>;
  googleOAuthToken(assertion: string): Promise<GoogleAccessTokenResponse>;
}

/**
 * GoogleAccessTokenParameters are the parameters to generate a Google Cloud
 * access token as described in:
 *
 *   https://cloud.google.com/iam/docs/reference/credentials/rest/v1/projects.serviceAccounts/generateAccessToken
 *
 * @param serviceAccount Optional email address or unique identifier of the
 * service account.
 * @param delegates Optional sequence of service accounts in the delegation
 * chain.
 * @param lifetime Optional validity period as a number representing the number
 * of seconds.
 */
export interface GoogleAccessTokenParameters {
  serviceAccount?: string;
  delegates?: Array<string>;
  scopes?: Array<string>;
  lifetime?: number;
}

/**
 * GoogleAccessTokenResponse is the response from generating an access token.
 *
 * @param accessToken OAuth 2.0 access token.
 * @param expiration A timestamp in RFC3339 UTC "Zulu" format when the token
 * expires.
 */
export interface GoogleAccessTokenResponse {
  accessToken: string;
  expiration: string;
}

/**
 * GoogleIDTokenParameters are the parameters to generate a Google Cloud
 * ID token as described in:
 *
 *   https://cloud.google.com/iam/docs/reference/credentials/rest/v1/projects.serviceAccounts/generateIdToken
 *
 * @param serviceAccount Email address or unique identifier of the service
 * account.
 * @param audience The audience for the token.
 * @param delegates Optional sequence of service accounts in the delegation
 * chain.
 */
export interface GoogleIDTokenParameters {
  serviceAccount?: string;
  audience: string;
  delegates?: Array<string>;
  includeEmail?: boolean;
}

/**
 * GoogleIDTokenResponse is the response from generating an ID token.
 *
 * @param token ID token.
 * expires.
 */
export interface GoogleIDTokenResponse {
  token: string;
}
