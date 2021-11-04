'use strict';

import * as core from '@actions/core';
import { WorkloadIdentityClient } from './client/workload_identity_client';
import { CredentialsJSONClient } from './client/credentials_json_client';
import { AuthClient } from './client/auth_client';
import { BaseClient } from './base';
import { explodeStrings } from './utils';

/**
 * Executes the main action, documented inline.
 */
async function run(): Promise<void> {
  try {
    // Load configuration.
    const projectID = core.getInput('project_id');
    const workloadIdentityProvider = core.getInput('workload_identity_provider');
    const serviceAccount = core.getInput('service_account');
    const audience =
      core.getInput('audience') || `https://iam.googleapis.com/${workloadIdentityProvider}`;
    const credentialsJSON = core.getInput('credentials_json');
    const createCredentialsFile = core.getBooleanInput('create_credentials_file');
    const tokenFormat = core.getInput('token_format');
    const delegates = explodeStrings(core.getInput('delegates'));

    // Ensure exactly one of workload_identity_provider and credentials_json was
    // provided.
    if (
      (!workloadIdentityProvider && !credentialsJSON) ||
      (workloadIdentityProvider && credentialsJSON)
    ) {
      throw new Error(
        'The GitHub Action workflow must specify exactly one of ' +
          '"workload_identity_provider" or "credentials_json"!',
      );
    }

    // Ensure a service_account was provided if using WIF.
    if (workloadIdentityProvider && !serviceAccount) {
      throw new Error(
        'The GitHub Action workflow must specify a "service_account" to ' +
          'impersonate when using "workload_identity_provider"!',
      );
    }

    // Instantiate the correct client based on the provided input parameters.
    let client: AuthClient;
    if (workloadIdentityProvider) {
      const token = await core.getIDToken(audience);
      client = new WorkloadIdentityClient({
        projectID: projectID,
        providerID: workloadIdentityProvider,
        serviceAccount: serviceAccount,
        token: token,
        audience: audience,
      });
    } else {
      client = new CredentialsJSONClient({
        projectID: projectID,
        credentialsJSON: credentialsJSON,
      });
    }

    // Always write the credentials file first, before trying to generate
    // tokens. This will ensure the file is written even if token generation
    // fails, which means continue-on-error actions will still have the file
    // available.
    if (createCredentialsFile) {
      const runnerTempDir = process.env.RUNNER_TEMP;
      if (!runnerTempDir) {
        throw new Error('$RUNNER_TEMP is not set');
      }

      const credentialsPath = await client.createCredentialsFile(runnerTempDir);
      core.setOutput('credentials_file_path', credentialsPath);
      core.exportVariable('CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE', credentialsPath);
      core.exportVariable('GOOGLE_APPLICATION_CREDENTIALS', credentialsPath);
    }

    // Set the project ID environment variables to the computed values.
    const computedProjectID = await client.getProjectID();
    core.setOutput('project_id', computedProjectID);
    core.exportVariable('CLOUDSDK_PROJECT', computedProjectID);
    core.exportVariable('CLOUDSDK_CORE_PROJECT', computedProjectID);
    core.exportVariable('GCP_PROJECT', computedProjectID);
    core.exportVariable('GCLOUD_PROJECT', computedProjectID);
    core.exportVariable('GOOGLE_CLOUD_PROJECT', computedProjectID);

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
        const serviceAccount = await client.getServiceAccount();

        const authToken = await client.getAuthToken();
        const { accessToken, expiration } = await BaseClient.googleAccessToken(authToken, {
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
        const serviceAccount = await client.getServiceAccount();

        const authToken = await client.getAuthToken();
        const { token } = await BaseClient.googleIDToken(authToken, {
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
        throw new Error(`Unknown token format "${tokenFormat}"`);
      }
    }
  } catch (err) {
    core.setFailed(`Action failed with error: ${err}`);
  }
}

run();
