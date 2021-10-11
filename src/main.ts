'use strict';

import * as core from '@actions/core';
import { WIFClient } from './wif';
import { ActionAuth } from './actionauth';
import { explodeStrings } from './utils';

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
    // audience will default to the WIF provider ID when used with WIF
    const audience = core.getInput('audience');
    const createCredentialsFile = core.getBooleanInput('create_credentials_file');
    const activateCredentialsFile = core.getBooleanInput('activate_credentials_file');
    const tokenFormat = core.getInput('token_format');
    const delegates = explodeStrings(core.getInput('delegates'));

    const client: ActionAuth = new WIFClient({
      providerID: workloadIdentityProvider,
      serviceAccount: serviceAccount,
      audience: audience,
    });

    // Always write the credentials file first, before trying to generate
    // tokens. This will ensure the file is written even if token generation
    // fails, which means continue-on-error actions will still have the file
    // available.
    if (createCredentialsFile) {
      const runnerTempDir = process.env.RUNNER_TEMP;
      if (!runnerTempDir) {
        throw new Error('$RUNNER_TEMP is not set');
      }

      const envVars = await client.createCredentialsFile(runnerTempDir);
      core.setOutput('credentials_file_path', envVars.get('GOOGLE_APPLICATION_CREDENTIALS'));

      // Also set the magic environment variable for gcloud and SDKs if
      // requested.
      if (activateCredentialsFile) {
        for (const [k, v] of envVars) {
          core.exportVariable(k, v);
        }
      }
    }

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

        const { accessToken, expiration } = await client.getAccessToken({
          serviceAccount,
          delegates,
          scopes: accessTokenScopes,
          lifetime: accessTokenLifetime,
        });

        core.setSecret(accessToken);
        core.setOutput('access_token', accessToken);
        core.setOutput('access_token_expiration', expiration);
        break;
      }
      case 'id_token': {
        const idTokenAudience = core.getInput('id_token_audience', { required: true });
        const idTokenIncludeEmail = core.getBooleanInput('id_token_include_email');
        const { token } = await client.getIDToken({
          serviceAccount,
          audience: idTokenAudience,
          delegates,
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
