'use strict';

import { URL } from 'url';
import * as core from '@actions/core';
import {
  ActionAuth,
  GoogleAccessTokenParameters,
  GoogleAccessTokenResponse,
  GoogleIDTokenParameters,
  GoogleIDTokenResponse,
} from './actionauth';
import { writeCredFile } from './utils';
import { BaseClient } from './base';

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
 * Available options to create the WIF client.
 *
 * @param providerID Full path (including project, location, etc) to the Google
 * Cloud Workload Identity Provider.
 * @param serviceAccount Email address or unique identifier of the service
 * account to impersonate
 * @param audience The value for the audience parameter in the generated GitHub Actions OIDC token,
 * defaults to the value of workload_identity_provider
 */
interface WIFClientOptions {
  providerID: string;
  serviceAccount: string;
  audience?: string;
}

export class WIFClient implements ActionAuth {
  readonly providerID: string;
  readonly serviceAccount: string;
  readonly audience: string;

  constructor(opts: WIFClientOptions) {
    this.providerID = opts.providerID;
    this.serviceAccount = opts.serviceAccount;
    this.audience = opts.audience ? opts.audience : `https://iam.googleapis.com/${this.providerID}`;
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
      const resp = await BaseClient.request(opts, JSON.stringify(data));
      const parsed = JSON.parse(resp);
      return parsed['access_token'];
    } catch (err) {
      throw new Error(`failed to generate Google Cloud federated token for ${providerID}: ${err}`);
    }
  }

  /**
   * getFederatedToken generates a Google Cloud federated token using the
   * GitHub OIDC token.
   */
  private async getFederatedToken(): Promise<string> {
    // Get the GitHub OIDC token.
    const githubOIDCToken = await core.getIDToken(this.audience);
    // Exchange the GitHub OIDC token for a Google Federated Token.
    const googleFederatedToken = await WIFClient.googleFederatedToken({
      providerID: this.providerID,
      token: githubOIDCToken,
    });
    core.setSecret(googleFederatedToken);
    return googleFederatedToken;
  }

  /**
   * getAccessToken generates a Google Cloud access token for the provided
   * service account email or unique id.
   */
  async getAccessToken(opts: GoogleAccessTokenParameters): Promise<GoogleAccessTokenResponse> {
    const googleFederatedToken = await this.getFederatedToken();
    return await BaseClient.googleAccessToken(googleFederatedToken, opts);
  }

  /**
   * getIDToken generates a Google Cloud ID token for the provided
   * service account email or unique id.
   */
  async getIDToken(tokenParams: GoogleIDTokenParameters): Promise<GoogleIDTokenResponse> {
    const googleFederatedToken = await this.getFederatedToken();
    return await BaseClient.googleIDToken(googleFederatedToken, tokenParams);
  }

  /**
   * createCredentialsFile creates a Google Cloud credentials file that can be
   * set as GOOGLE_APPLICATION_CREDENTIALS for gcloud and client libraries.
   */
  async createCredentialsFile(outputDir: string): Promise<Map<string, string>> {
    // Extract the request token and request URL from the environment. These
    // are only set when an id-token is requested and the submitter has
    // collaborator permissions.
    const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
    const requestURLRaw = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
    if (!requestToken || !requestURLRaw) {
      throw new Error(
        'GitHub Actions did not inject $ACTIONS_ID_TOKEN_REQUEST_TOKEN or ' +
          '$ACTIONS_ID_TOKEN_REQUEST_URL into this job. This most likely ' +
          'means the GitHub Actions workflow permissions are incorrect, or ' +
          'this job is being run from a fork. For more information, please ' +
          'see the GitHub documentation at https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token',
      );
    }
    const requestURL = new URL(requestURLRaw);

    // Append the audience value to the request.
    const params = requestURL.searchParams;
    params.set('audience', this.audience);
    requestURL.search = params.toString();
    const data = {
      type: 'external_account',
      audience: `//iam.googleapis.com/${this.providerID}`,
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      token_url: 'https://sts.googleapis.com/v1/token',
      service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${this.serviceAccount}:generateAccessToken`,
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

    const pth = await writeCredFile(outputDir, JSON.stringify(data));
    return new Map<string, string>([['GOOGLE_APPLICATION_CREDENTIALS', pth]]);
  }
}
