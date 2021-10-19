'use strict';

import * as core from '@actions/core';
import { WIFClient } from './workload_identity';
import { ActionAuth } from './actionauth';
import { explodeStrings } from './utils';
import { KeyClient } from './key';

/**
 * Executes the main action, documented inline.
 */
async function run(): Promise<void> {
  try {
    // Load configuration.
    const workloadIdentityProvider = core.getInput('workload_identity_provider');
    const serviceAccount = core.getInput('service_account');
    // audience will default to the WIF provider ID when used with WIF
    const audience = core.getInput('audience');
    const createCredentialsFile = core.getBooleanInput('create_credentials_file');
    const activateCredentialsFile = core.getBooleanInput('activate_credentials_file');
    const tokenFormat = core.getInput('token_format');
    const delegates = explodeStrings(core.getInput('delegates'));
    const credentials = core.getInput('credentials_json');

    if (credentials && workloadIdentityProvider) {
      throw new Error(
        'Only one of `credentials_json` or `workload_identity_provider` should be specified.',
      );
    }

    if (!credentials && !workloadIdentityProvider) {
      throw new Error(
        'One of `credentials_json` or `workload_identity_provider` must be specified.',
      );
    }

    const client: ActionAuth = workloadIdentityProvider
      ? new WIFClient({
          providerID: workloadIdentityProvider,
          serviceAccount: serviceAccount,
          audience: audience,
        })
      : new KeyClient({ credentials });

    // Always write the credentials file first, before trying to generate
    // tokens. This will ensure the file is written even if token generation
    // fails, which means continue-on-error actions will still have the file
    // available.
    if (createCredentialsFile) {
      const runnerTempDir = process.env.RUNNER_TEMP;
      if (!runnerTempDir) {
        throw new Error('$RUNNER_TEMP is not set');
      }

      const { credentialsPath, envVars } = await client.createCredentialsFile(runnerTempDir);
      core.setOutput('credentials_file_path', credentialsPath);

      // Also set the magic environment variable for gcloud and SDKs if
      // requested.
      if (activateCredentialsFile && envVars) {
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
