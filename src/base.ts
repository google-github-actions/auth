'use strict';

import { HttpClient } from '@actions/http-client';
import { URLSearchParams } from 'url';
import {
  GoogleAccessTokenParameters,
  GoogleAccessTokenResponse,
  GoogleIDTokenParameters,
  GoogleIDTokenResponse,
} from './client/auth_client';

// Do not listen to the linter - this can NOT be rewritten as an ES6 import statement.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: appVersion } = require('../package.json');

// userAgent is the default user agent.
const userAgent = `google-github-actions:auth/${appVersion}`;

/**
 * BaseClient is the default HTTP client for interacting with the IAM
 * credentials API.
 */
export class BaseClient {
  /**
   * client is the HTTP client.
   */
  protected readonly client: HttpClient;

  constructor() {
    this.client = new HttpClient(userAgent);
  }

  /**
   * googleIDToken generates a Google Cloud ID token for the provided
   * service account email or unique id.
   */
  async googleIDToken(
    token: string,
    { serviceAccount, audience, delegates, includeEmail }: GoogleIDTokenParameters,
  ): Promise<GoogleIDTokenResponse> {
    const pth = `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccount}:generateIdToken`;

    const data = {
      delegates: delegates,
      audience: audience,
      includeEmail: includeEmail,
    };

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const resp = await this.client.request('POST', pth, JSON.stringify(data), headers);
      const body = await resp.readBody();
      const statusCode = resp.message.statusCode || 500;
      if (statusCode >= 400) {
        throw new Error(`(${statusCode}) ${body}`);
      }
      const parsed = JSON.parse(body);
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
  async googleAccessToken(
    token: string,
    { serviceAccount, delegates, scopes, lifetime }: GoogleAccessTokenParameters,
  ): Promise<GoogleAccessTokenResponse> {
    const pth = `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccount}:generateAccessToken`;

    const data: Record<string, string | Array<string>> = {};
    if (delegates && delegates.length > 0) {
      data.delegates = delegates;
    }
    if (scopes && scopes.length > 0) {
      // Not a typo, the API expects the field to be "scope" (singular).
      data.scope = scopes;
    }
    if (lifetime && lifetime > 0) {
      data.lifetime = `${lifetime}s`;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const resp = await this.client.request('POST', pth, JSON.stringify(data), headers);
      const body = await resp.readBody();
      const statusCode = resp.message.statusCode || 500;
      if (statusCode >= 400) {
        throw new Error(`(${statusCode}) ${body}`);
      }
      const parsed = JSON.parse(body);
      return {
        accessToken: parsed['accessToken'],
        expiration: parsed['expireTime'],
      };
    } catch (err) {
      throw new Error(`Failed to generate Google Cloud access token for ${serviceAccount}: ${err}`);
    }
  }

  /**
   * googleOAuthToken generates a Google Cloud OAuth token using the legacy
   * OAuth endpoints.
   *
   * @param assertion A signed JWT.
   */
  async googleOAuthToken(assertion: string): Promise<GoogleAccessTokenResponse> {
    const pth = `https://oauth2.googleapis.com/token`;

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const data = new URLSearchParams();
    data.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    data.append('assertion', assertion);

    try {
      const resp = await this.client.request('POST', pth, data.toString(), headers);
      const body = await resp.readBody();
      const statusCode = resp.message.statusCode || 500;
      if (statusCode >= 400) {
        throw new Error(`(${statusCode}) ${body}`);
      }
      const parsed = JSON.parse(body);

      // Normalize the expiration to be a timestamp like the iamcredentials API.
      // This API returns the number of seconds until expiration, so convert
      // that into a date.
      const expiration = new Date(new Date().getTime() + parsed['expires_in'] * 10000);

      return {
        accessToken: parsed['access_token'],
        expiration: expiration.toISOString(),
      };
    } catch (err) {
      throw new Error(`Failed to generate Google Cloud OAuth token: ${err}`);
    }
  }
}
