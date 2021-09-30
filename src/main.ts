'use strict';

import * as core from '@actions/core';
import { Client } from './client';
import { URL } from 'url';

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
    const createCredentialsFile = core.getBooleanInput('create_credentials_file');
    const activateCredentialsFile = core.getBooleanInput('activate_credentials_file');
    const tokenFormat = core.getInput('token_format');
    const delegates = explodeStrings(core.getInput('delegates'));

    // Always write the credentials file first, before trying to generate
    // tokens. This will ensure the file is written even if token generation
    // fails, which means continue-on-error actions will still have the file
    // available.
    if (createCredentialsFile) {
      const runnerTempDir = process.env.RUNNER_TEMP;
      if (!runnerTempDir) {
        throw new Error('$RUNNER_TEMP is not set');
      }

      // Extract the request token and request URL from the environment. These
      // are only set when an id-token is requested and the submitter has
      // collaborator permissions.
      const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
      if (!requestToken) {
        throw new Error('$ACTIONS_ID_TOKEN_REQUEST_TOKEN is not set');
      }
      const requestURLRaw = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
      if (!requestURLRaw) {
        throw new Error('$ACTIONS_ID_TOKEN_REQUEST_URL is not set');
      }
      const requestURL = new URL(requestURLRaw);

      // Append the audience value to the request.
      const params = requestURL.searchParams;
      params.set('audience', audience);
      requestURL.search = params.toString();

      // Create the credentials file.
      const outputPath = await Client.createCredentialsFile({
        providerID: workloadIdentityProvider,
        serviceAccount: serviceAccount,
        requestToken: requestToken,
        requestURL: requestURL.toString(),
        outputDir: runnerTempDir,
      });
      core.setOutput('credentials_file_path', outputPath);

      // Also set the magic environment variable for gcloud and SDKs if
      // requested.
      if (activateCredentialsFile) {
        core.exportVariable('GOOGLE_APPLICATION_CREDENTIALS', outputPath);
      }
    }

    // getFederatedToken is a closure that gets the federated token.
    const getFederatedToken = async (): Promise<string> => {
      // Get the GitHub OIDC token.
      const githubOIDCToken = await core.getIDToken(audience);

      // Exchange the GitHub OIDC token for a Google Federated Token.
      const googleFederatedToken = await Client.googleFederatedToken({
        providerID: workloadIdentityProvider,
        token: githubOIDCToken,
      });
      core.setSecret(googleFederatedToken);
      return googleFederatedToken;
    };

    switch (tokenFormat) {
      case '': {
        break;
      }
      case null: {
        break;
      }
      case 'access_token': {
        const accessTokenLifetime = core.getInput('access_token_lifetime');
        const accessTokenScopes = explodeStrings(core.getInput('access_token_scopes'));

        const googleFederatedToken = await getFederatedToken();
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
        const idTokenAudience = core.getInput('id_token_audience', { required: true });
        const idTokenIncludeEmail = core.getBooleanInput('id_token_include_email');

        const googleFederatedToken = await getFederatedToken();
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
