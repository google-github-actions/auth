'use strict';

import {
  exportVariable,
  getBooleanInput,
  getIDToken,
  getInput,
  setFailed,
  setOutput,
  setSecret,
} from '@actions/core';
import { WorkloadIdentityClient } from './client/workload_identity_client';
import { CredentialsJSONClient } from './client/credentials_json_client';
import { AuthClient } from './client/auth_client';
import { BaseClient } from './base';
import { explodeStrings } from './utils';

const secretsWarning =
  'If you are specifying input values via GitHub secrets, ensure the secret ' +
  'is being injected into the environment. By default, secrets are not passed ' +
  'to workflows triggered from forks, including Dependabot.';

/**
 * Executes the main action, documented inline.
 */
async function run(): Promise<void> {
  try {
    // Load configuration.
    const projectID = getInput('project_id');
    const workloadIdentityProvider = getInput('workload_identity_provider');
    const serviceAccount = getInput('service_account');
    const audience =
      getInput('audience') || `https://iam.googleapis.com/${workloadIdentityProvider}`;
    const credentialsJSON = getInput('credentials_json');
    const createCredentialsFile = getBooleanInput('create_credentials_file');
    const tokenFormat = getInput('token_format');
    const delegates = explodeStrings(getInput('delegates'));

    // Ensure exactly one of workload_identity_provider and credentials_json was
    // provided.
    if (
      (!workloadIdentityProvider && !credentialsJSON) ||
      (workloadIdentityProvider && credentialsJSON)
    ) {
      throw new Error(
        'The GitHub Action workflow must specify exactly one of ' +
          '"workload_identity_provider" or "credentials_json"! ' +
          secretsWarning,
      );
    }

    // Ensure a service_account was provided if using WIF.
    if (workloadIdentityProvider && !serviceAccount) {
      throw new Error(
        'The GitHub Action workflow must specify a "service_account" to ' +
          'impersonate when using "workload_identity_provider"! ' +
          secretsWarning,
      );
    }

    // Instantiate the correct client based on the provided input parameters.
    let client: AuthClient;
    if (workloadIdentityProvider) {
      const token = await getIDToken(audience);
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
      // Note: We explicitly and intentionally export to GITHUB_WORKSPACE
      // instead of RUNNER_TEMP, because RUNNER_TEMP is not shared with
      // Docker-based actions on the filesystem. Exporting to GITHUB_WORKSPACE
      // ensures that the exported credentials are automatically available to
      // Docker-based actions without user modification.
      //
      // This has the unintended side-effect of leaking credentials over time,
      // because GITHUB_WORKSPACE is not automatically cleaned up on self-hosted
      // runners. To mitigate this issue, this action defines a post step to
      // remove any created credentials.
      const githubWorkspace = process.env.GITHUB_WORKSPACE;
      if (!githubWorkspace) {
        throw new Error('$GITHUB_WORKSPACE is not set');
      }

      const credentialsPath = await client.createCredentialsFile(githubWorkspace);
      setOutput('credentials_file_path', credentialsPath);
      // CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE is picked up by gcloud to use
      // a specific credential file (subject to change and equivalent to auth/credential_file_override)
      exportVariable('CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE', credentialsPath);
      // GOOGLE_APPLICATION_CREDENTIALS is used by Application Default Credentials
      // in all GCP client libraries
      exportVariable('GOOGLE_APPLICATION_CREDENTIALS', credentialsPath);
      // GOOGLE_GHA_CREDS_PATH is used by other Google GitHub Actions
      exportVariable('GOOGLE_GHA_CREDS_PATH', credentialsPath);
    }

    // Set the project ID environment variables to the computed values.
    const computedProjectID = await client.getProjectID();
    setOutput('project_id', computedProjectID);
    exportVariable('CLOUDSDK_PROJECT', computedProjectID);
    exportVariable('CLOUDSDK_CORE_PROJECT', computedProjectID);
    exportVariable('GCP_PROJECT', computedProjectID);
    exportVariable('GCLOUD_PROJECT', computedProjectID);
    exportVariable('GOOGLE_CLOUD_PROJECT', computedProjectID);

    switch (tokenFormat) {
      case '': {
        break;
      }
      case null: {
        break;
      }
      case 'access_token': {
        const accessTokenLifetime = getInput('access_token_lifetime');
        const accessTokenScopes = explodeStrings(getInput('access_token_scopes'));
        const serviceAccount = await client.getServiceAccount();

        const authToken = await client.getAuthToken();
        const { accessToken, expiration } = await BaseClient.googleAccessToken(authToken, {
          serviceAccount,
          delegates,
          scopes: accessTokenScopes,
          lifetime: accessTokenLifetime,
        });

        setSecret(accessToken);
        setOutput('access_token', accessToken);
        setOutput('access_token_expiration', expiration);
        break;
      }
      case 'id_token': {
        const idTokenAudience = getInput('id_token_audience', { required: true });
        const idTokenIncludeEmail = getBooleanInput('id_token_include_email');
        const serviceAccount = await client.getServiceAccount();

        const authToken = await client.getAuthToken();
        const { token } = await BaseClient.googleIDToken(authToken, {
          serviceAccount,
          audience: idTokenAudience,
          delegates,
          includeEmail: idTokenIncludeEmail,
        });
        setSecret(token);
        setOutput('id_token', token);
        break;
      }
      default: {
        throw new Error(`Unknown token format "${tokenFormat}"`);
      }
    }
  } catch (err) {
    setFailed(`google-github-actions/auth failed with: ${err}`);
  }
}

run();
