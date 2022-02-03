'use strict';

import { join as pathjoin } from 'path';

import {
  debug as logDebug,
  exportVariable,
  getBooleanInput,
  getIDToken,
  getInput,
  info as logInfo,
  setFailed,
  setOutput,
  setSecret,
  warning as logWarning,
} from '@actions/core';
import {
  errorMessage,
  exactlyOneOf,
  isEmptyDir,
  isPinnedToHead,
  parseCSV,
  parseDuration,
  pinnedToHeadWarning,
} from '@google-github-actions/actions-utils';

import { WorkloadIdentityClient } from './client/workload_identity_client';
import { CredentialsJSONClient } from './client/credentials_json_client';
import { AuthClient } from './client/auth_client';
import { BaseClient } from './base';
import { buildDomainWideDelegationJWT, generateCredentialsFilename } from './utils';

const secretsWarning =
  `If you are specifying input values via GitHub secrets, ensure the secret ` +
  `is being injected into the environment. By default, secrets are not ` +
  `passed to workflows triggered from forks, including Dependabot.`;

const oidcWarning =
  `GitHub Actions did not inject $ACTIONS_ID_TOKEN_REQUEST_TOKEN or ` +
  `$ACTIONS_ID_TOKEN_REQUEST_URL into this job. This most likely means the ` +
  `GitHub Actions workflow permissions are incorrect, or this job is being ` +
  `run from a fork. For more information, please see https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token`;

/**
 * Executes the main action, documented inline.
 */
async function run(): Promise<void> {
  // Warn if pinned to HEAD
  if (isPinnedToHead()) {
    logWarning(pinnedToHeadWarning('v0'));
  }

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
    const delegates = parseCSV(getInput('delegates'));

    // Ensure exactly one of workload_identity_provider and credentials_json was
    // provided.
    if (!exactlyOneOf(workloadIdentityProvider, credentialsJSON)) {
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
      logDebug(`Using workload identity provider "${workloadIdentityProvider}"`);

      // If we're going to do the OIDC dance, we need to make sure these values
      // are set. If they aren't, core.getIDToken() will fail and so will
      // generating the credentials file.
      const oidcTokenRequestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
      const oidcTokenRequestURL = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
      if (!oidcTokenRequestToken || !oidcTokenRequestURL) {
        throw new Error(oidcWarning);
      }

      const token = await getIDToken(audience);
      client = new WorkloadIdentityClient({
        projectID: projectID,
        providerID: workloadIdentityProvider,
        serviceAccount: serviceAccount,
        token: token,
        audience: audience,
        oidcTokenRequestToken: oidcTokenRequestToken,
        oidcTokenRequestURL: oidcTokenRequestURL,
      });
    } else {
      logDebug(`Using credentials JSON`);
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
      logDebug(`Creating credentials file`);

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

      // There have been a number of issues where users have not used the
      // "actions/checkout" step before our action. Our action relies on the
      // creation of that directory; worse, if a user puts "actions/checkout"
      // after our action, it will delete the exported credential. This
      // following code does a small check to see if there are any files in the
      // directory. It emits a warning if there are no files, since there may be
      // legitimate use cases for authenticating without checking out the
      // repository.
      const githubWorkspaceIsEmpty = await isEmptyDir(githubWorkspace);
      if (githubWorkspaceIsEmpty) {
        logWarning(
          `The "create_credentials_file" option is true, but the current ` +
            `GitHub workspace is empty. Did you forget to use ` +
            `"actions/checkout" before this step? If you do not intend to ` +
            `share authentication with future steps in this job, set ` +
            `"create_credentials_file" to false.`,
        );
      }

      // Create credentials file.
      const outputFile = generateCredentialsFilename();
      const outputPath = pathjoin(githubWorkspace, outputFile);
      const credentialsPath = await client.createCredentialsFile(outputPath);
      logInfo(`Created credentials file at "${credentialsPath}"`);

      // Output to be available to future steps.
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
        logDebug(`Creating access token`);

        const accessTokenLifetime = parseDuration(getInput('access_token_lifetime'));
        const accessTokenScopes = parseCSV(getInput('access_token_scopes'));
        const accessTokenSubject = getInput('access_token_subject');
        const serviceAccount = await client.getServiceAccount();

        // If a subject was provided, use the traditional OAuth 2.0 flow to
        // perform Domain-Wide Delegation. Otherwise, use the modern IAM
        // Credentials endpoints.
        let accessToken, expiration;
        if (accessTokenSubject) {
          logInfo(
            `An access token subject was specified, triggering Domain-Wide ` +
              `Delegation flow. This flow does not support specifying an ` +
              `access token lifetime of greater than 1 hour.`,
          );

          const unsignedJWT = buildDomainWideDelegationJWT(
            serviceAccount,
            accessTokenSubject,
            accessTokenScopes,
            accessTokenLifetime,
          );
          const signedJWT = await client.signJWT(unsignedJWT, delegates);
          ({ accessToken, expiration } = await BaseClient.googleOAuthToken(signedJWT));
        } else {
          const authToken = await client.getAuthToken();
          ({ accessToken, expiration } = await BaseClient.googleAccessToken(authToken, {
            serviceAccount,
            delegates,
            scopes: accessTokenScopes,
            lifetime: accessTokenLifetime,
          }));
        }

        setSecret(accessToken);
        setOutput('access_token', accessToken);
        setOutput('access_token_expiration', expiration);
        break;
      }
      case 'id_token': {
        logDebug(`Creating id token`);

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
    const msg = errorMessage(err);
    setFailed(`google-github-actions/auth failed with: ${msg}`);
  }
}

run();
