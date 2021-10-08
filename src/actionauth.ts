/**
 * Defines the main interface for all clients that generate credentials.
 */
export interface ActionAuth {
  getAccessToken(opts: GoogleAccessTokenParameters): Promise<GoogleAccessTokenResponse>;
  getIDToken(opts: GoogleIDTokenParameters): Promise<GoogleIDTokenResponse>;
  createCredentialsFile(outputDir: string): Promise<Map<string, string>>;
}

/**
 * GoogleAccessTokenParameters are the parameters to generate a Google Cloud
 * access token as described in:
 *
 *   https://cloud.google.com/iam/docs/reference/credentials/rest/v1/projects.serviceAccounts/generateAccessToken
 *
 * @param serviceAccount Optional email address or unique identifier of the service
 * account.
 * @param delegates Optional sequence of service accounts in the delegation
 * chain.
 * @param lifetime Optional validity period as a duration.
 */
export interface GoogleAccessTokenParameters {
  serviceAccount?: string;
  delegates?: Array<string>;
  scopes?: Array<string>;
  lifetime?: string;
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
