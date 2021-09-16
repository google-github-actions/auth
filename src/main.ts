'use strict';

import * as core from '@actions/core';
import { Client } from './client';

/**
 * Converts a multi-line or comma-separated collection of strings into an array
 * of trimmed strings.
 */
function explodeStrings(input: string): Array<string> {
  if (input == null || input.length === 0) {
    return [];
  }

  const list = new Array<string>();
  for (const line of input.split(`\n`)) {
    for (const piece of line.split(',')) {
      const entry = piece.trim();
      if (entry !== '') {
        list.push(entry);
      }
    }
  }
  return list;
}

/**
 * Executes the main action, documented inline.
 */
async function run(): Promise<void> {
  try {
    // Load configuration.
    const workloadIdentityProvider = core.getInput('workload_identity_provider', {
      required: true,
    });
    const serviceAccount = core.getInput('service_account', { required: true });
    const audience = core.getInput('audience');
    const delegates = explodeStrings(core.getInput('delegates'));
    const lifetime = core.getInput('lifetime');
    const idTokenAudience = core.getInput('id_token_audience');

    // Extract the GitHub Actions OIDC token.
    const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
    if (!requestToken) {
      throw `missing ACTIONS_ID_TOKEN_REQUEST_TOKEN`;
    }
    const requestURL = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
    if (!requestURL) {
      throw `missing ACTIONS_ID_TOKEN_REQUEST_URL`;
    }
    const githubOIDCToken = await Client.githubToken({
      url: requestURL,
      token: requestToken,
      audience: audience,
    });
    core.setSecret(githubOIDCToken);

    // Exchange the GitHub OIDC token for a Google Federated Token.
    const googleFederatedToken = await Client.googleFederatedToken({
      providerID: workloadIdentityProvider,
      token: githubOIDCToken,
    });
    core.setSecret(googleFederatedToken);

    // Exchange the Google Federated Token for an access token.
    const { accessToken, expiration } = await Client.googleAccessToken({
      token: googleFederatedToken,
      serviceAccount: serviceAccount,
      delegates: delegates,
      lifetime: lifetime,
    });
    core.setSecret(accessToken);
    core.setOutput('access_token', accessToken);
    core.setOutput('expiration', expiration);

    // Exchange the Google Federated Token for an ID token.
    if (idTokenAudience != '') {
      const { token } = await Client.googleIDToken({
        token: googleFederatedToken,
        serviceAccount: serviceAccount,
        delegates: delegates,
        audience: idTokenAudience,
      });
      core.setSecret(token);
      core.setOutput('id_token', token);
    }
  } catch (err) {
    core.setFailed(`Action failed with error: ${err}`);
  }
}

run();
