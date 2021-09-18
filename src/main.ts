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
    const tokenFormat = core.getInput('token_format', { required: true });
    const delegates = explodeStrings(core.getInput('delegates'));
    const accessTokenLifetime = core.getInput('access_token_lifetime');
    const accessTokenScopes = explodeStrings(core.getInput('access_token_scopes'));
    const idTokenAudience = core.getInput('id_token_audience');
    const idTokenIncludeEmail = core.getBooleanInput('id_token_include_email');

    // Get the GitHub OIDC token.
    const githubOIDCToken = await core.getIDToken(audience);

    // Exchange the GitHub OIDC token for a Google Federated Token.
    const googleFederatedToken = await Client.googleFederatedToken({
      providerID: workloadIdentityProvider,
      token: githubOIDCToken,
    });
    core.setSecret(googleFederatedToken);

    switch (tokenFormat) {
      case 'access_token': {
        // Exchange the Google Federated Token for an access token.
        const { accessToken, expiration } = await Client.googleAccessToken({
          token: googleFederatedToken,
          serviceAccount: serviceAccount,
          delegates: delegates,
          lifetime: accessTokenLifetime,
          scopes: accessTokenScopes,
        });
        core.setSecret(accessToken);
        core.setOutput('access_token', accessToken);
        core.setOutput('access_token_expiration', expiration);
        break;
      }
      case 'id_token': {
        // Exchange the Google Federated Token for an id token.
        const { token } = await Client.googleIDToken({
          token: googleFederatedToken,
          serviceAccount: serviceAccount,
          delegates: delegates,
          audience: idTokenAudience,
          includeEmail: idTokenIncludeEmail,
        });
        core.setSecret(token);
        core.setOutput('id_token', token);
        break;
      }
      default: {
        throw new Error(`unknown token format "${tokenFormat}"`);
      }
    }
  } catch (err) {
    core.setFailed(`Action failed with error: ${err}`);
  }
}

run();
