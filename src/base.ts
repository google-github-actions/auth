'use strict';

import https, { RequestOptions } from 'https';
import { URL } from 'url';
import {
  GoogleAccessTokenParameters,
  GoogleAccessTokenResponse,
  GoogleIDTokenParameters,
  GoogleIDTokenResponse,
} from './client/auth_client';

// Do not listen to the linter - this can NOT be rewritten as an ES6 import statement.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: appVersion } = require('../package.json');

export class BaseClient {
  /**
   * request is a high-level helper that returns a promise from the executed
   * request.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  static request(opts: RequestOptions, data?: any): Promise<string> {
    if (!opts.headers) {
      opts.headers = {};
    }

    if (!opts.headers['User-Agent']) {
      opts.headers['User-Agent'] = `google-github-actions:auth/${appVersion}`;
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
   * googleIDToken generates a Google Cloud ID token for the provided
   * service account email or unique id.
   */
  static async googleIDToken(
    token: string,
    { serviceAccount, audience, delegates, includeEmail }: GoogleIDTokenParameters,
  ): Promise<GoogleIDTokenResponse> {
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
      const resp = await BaseClient.request(opts, JSON.stringify(data));
      const parsed = JSON.parse(resp);
      return {
        token: parsed['token'],
      };
    } catch (err) {
      throw new Error(`failed to generate Google Cloud ID token for ${serviceAccount}: ${err}`);
    }
  }

  /**
   * googleAccessToken generates a Google Cloud access token for the provided
   * service account email or unique id.
   */
  static async googleAccessToken(
    token: string,
    { serviceAccount, delegates, scopes, lifetime }: GoogleAccessTokenParameters,
  ): Promise<GoogleAccessTokenResponse> {
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
      const resp = await BaseClient.request(opts, JSON.stringify(data));
      const parsed = JSON.parse(resp);
      return {
        accessToken: parsed['accessToken'],
        expiration: parsed['expireTime'],
      };
    } catch (err) {
      throw new Error(`Failed to generate Google Cloud access token for ${serviceAccount}: ${err}`);
    }
  }
}
