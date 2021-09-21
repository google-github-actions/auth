'use strict';

import https, { RequestOptions } from 'https';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';
import { URL } from 'url';

/**
 * GoogleFederatedTokenParameters are the parameters to generate a Federated
 * Identity Token as described in:
 *
 *   https://cloud.google.com/iam/docs/access-resources-oidc#exchange-token
 *
 * @param providerID Full path (including project, location, etc) to the Google
 * Cloud Workload Identity Provider.
 * @param token OIDC token to exchange for a Google Cloud federated token.
 */
interface GoogleFederatedTokenParameters {
  providerID: string;
  token: string;
}

/**
 * GoogleAccessTokenParameters are the parameters to generate a Google Cloud
 * access token as described in:
 *
 *   https://cloud.google.com/iam/docs/reference/credentials/rest/v1/projects.serviceAccounts/generateAccessToken
 *
 * @param token OAuth token or Federated access token with permissions to call
 * the API.
 * @param serviceAccount Email address or unique identifier of the service
 * account.
 * @param delegates Optional sequence of service accounts in the delegation
 * chain.
 * @param lifetime Optional validity period as a duration.
 */
interface GoogleAccessTokenParameters {
  token: string;
  serviceAccount: string;
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
interface GoogleAccessTokenResponse {
  accessToken: string;
  expiration: string;
}

/**
 * GoogleIDTokenParameters are the parameters to generate a Google Cloud
 * ID token as described in:
 *
 *   https://cloud.google.com/iam/docs/reference/credentials/rest/v1/projects.serviceAccounts/generateIdToken
 *
 * @param token OAuth token or Federated access token with permissions to call
 * the API.
 * @param serviceAccount Email address or unique identifier of the service
 * account.
 * @param audience The audience for the token.
 * @param delegates Optional sequence of service accounts in the delegation
 * chain.
 */
interface GoogleIDTokenParameters {
  token: string;
  serviceAccount: string;
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
interface GoogleIDTokenResponse {
  token: string;
}

/**
 * CreateCredentialsFileParameters are the parameters to generate a Google Cloud
 * credentials file for use with gcloud and other SDKs.
 *
 * @param providerID Full path (including project, location, etc) to the Google
 * Cloud Workload Identity Provider.
 * @param serviceAccount Email address or unique identifier of the service
 * account to impersonate
 * @param requestToken Local environment token to use as authentication to
 * acquire the real OIDC token.
 * @param requestURL URL endpoint to use to request the token.
 * @param outputDir Path to a directory on disk where the file should be
 * written. The function will determine the file name and write to it securely.
 */
interface CreateCredentialsFileParameters {
  providerID: string;
  serviceAccount: string;
  requestToken: string;
  requestURL: string;
  outputDir: string;
}

export class Client {
  /**
   * request is a high-level helper that returns a promise from the executed
   * request.
   */
  static request(opts: RequestOptions, data?: any): Promise<string> {
    if (!opts.headers) {
      opts.headers = {};
    }

    if (!opts.headers['User-Agent']) {
      opts.headers['User-Agent'] = 'sethvargo:oidc-auth-google-cloud/0.2.1';
    }

    return new Promise((resolve, reject) => {
      const req = https.request(opts, (res) => {
        res.setEncoding('utf8');

        let body = '';
        res.on('data', (data) => {
          body += data;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(body);
          } else {
            resolve(body);
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (data != null) {
        req.write(data);
      }

      req.end();
    });
  }

  /**
   * googleFederatedToken generates a Google Cloud federated token using the
   * provided OIDC token and Workload Identity Provider.
   */
  static async googleFederatedToken({
    providerID,
    token,
  }: GoogleFederatedTokenParameters): Promise<string> {
    const stsURL = new URL('https://sts.googleapis.com/v1/token');

    const data = {
      audience: '//iam.googleapis.com/' + providerID,
      grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
      requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      subjectTokenType: 'urn:ietf:params:oauth:token-type:jwt',
      subjectToken: token,
    };

    const opts = {
      hostname: stsURL.hostname,
      port: stsURL.port,
      path: stsURL.pathname + stsURL.search,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    try {
      const resp = await Client.request(opts, JSON.stringify(data));
      const parsed = JSON.parse(resp);
      return parsed['access_token'];
    } catch (err) {
      throw new Error(`failed to generate Google Cloud federated token for ${providerID}: ${err}`);
    }
  }

  /**
   * googleAccessToken generates a Google Cloud access token for the provided
   * service account email or unique id.
   */
  static async googleAccessToken({
    token,
    serviceAccount,
    delegates,
    scopes,
    lifetime,
  }: GoogleAccessTokenParameters): Promise<GoogleAccessTokenResponse> {
    const serviceAccountID = `projects/-/serviceAccounts/${serviceAccount}`;
    const tokenURL = new URL(
      `https://iamcredentials.googleapis.com/v1/${serviceAccountID}:generateAccessToken`,
    );

    const data = {
      delegates: delegates,
      lifetime: lifetime,
      scope: scopes,
    };

    const opts = {
      hostname: tokenURL.hostname,
      port: tokenURL.port,
      path: tokenURL.pathname + tokenURL.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    try {
      const resp = await Client.request(opts, JSON.stringify(data));
      const parsed = JSON.parse(resp);
      return {
        accessToken: parsed['accessToken'],
        expiration: parsed['expireTime'],
      };
    } catch (err) {
      throw new Error(`failed to generate Google Cloud access token for ${serviceAccount}: ${err}`);
    }
  }

  /**
   * googleIDToken generates a Google Cloud ID token for the provided
   * service account email or unique id.
   */
  static async googleIDToken({
    token,
    serviceAccount,
    audience,
    delegates,
    includeEmail,
  }: GoogleIDTokenParameters): Promise<GoogleIDTokenResponse> {
    const serviceAccountID = `projects/-/serviceAccounts/${serviceAccount}`;
    const tokenURL = new URL(
      `https://iamcredentials.googleapis.com/v1/${serviceAccountID}:generateIdToken`,
    );

    const data = {
      delegates: delegates,
      audience: audience,
      includeEmail: includeEmail,
    };

    const opts = {
      hostname: tokenURL.hostname,
      port: tokenURL.port,
      path: tokenURL.pathname + tokenURL.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    try {
      const resp = await Client.request(opts, JSON.stringify(data));
      const parsed = JSON.parse(resp);
      return {
        token: parsed['token'],
      };
    } catch (err) {
      throw new Error(`failed to generate Google Cloud ID token for ${serviceAccount}: ${err}`);
    }
  }

  /**
   * createCredentialsFile creates a Google Cloud credentials file that can be
   * set as GOOGLE_APPLICATION_CREDENTIALS for gcloud and client libraries.
   */
  static async createCredentialsFile({
    providerID,
    serviceAccount,
    requestToken,
    requestURL,
    outputDir,
  }: CreateCredentialsFileParameters): Promise<string> {
    const data = {
      type: 'external_account',
      audience: `//iam.googleapis.com/${providerID}`,
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      token_url: 'https://sts.googleapis.com/v1/token',
      service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccount}:generateAccessToken`,
      credential_source: {
        url: requestURL,
        headers: {
          Authorization: `Bearer ${requestToken}`,
        },
        format: {
          type: 'json',
          subject_token_field_name: 'value',
        },
      },
    };

    // Generate a random filename to store the credential. 12 bytes is 24
    // characters in hex. It's not the ideal entropy, but we have to be under
    // the 255 character limit for Windows filenames (which includes their
    // entire leading path).
    const uniqueName = crypto.randomBytes(12).toString('hex');
    const pth = path.join(outputDir, uniqueName);

    // Write the file as 0640 so the owner has RW, group as R, and the file is
    // otherwise unreadable. Also write with EXCL to prevent a symlink attack.
    await fs.writeFile(pth, JSON.stringify(data), { mode: 0o640, flag: 'wx' });

    return pth;
  }
}
