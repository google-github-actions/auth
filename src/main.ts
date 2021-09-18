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

    const githubOIDCToken = await core.getIDToken(audience);

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
  } catch (err) {
    core.setFailed(`Action failed with error: ${err}`);
  }
}

run();
