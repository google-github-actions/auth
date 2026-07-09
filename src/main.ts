// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { join as pathjoin } from 'path';

import {
  exportVariable,
  getIDToken,
  getInput,
  setFailed,
  setOutput,
  setSecret,
} from '@actions/core';
import {
  errorMessage,
  exactlyOneOf,
  isEmptyDir,
  isPinnedToHead,
  parseMultilineCSV,
  parseBoolean,
  parseDuration,
  pinnedToHeadWarning,
  withRetries,
} from '@google-github-actions/actions-utils';

import {
  AuthClient,
  IAMCredentialsClient,
  ServiceAccountKeyClient,
  WorkloadIdentityFederationClient,
} from './client/client';
import { Logger } from './logger';
import {
  buildDomainWideDelegationJWT,
  computeProjectID,
  computeServiceAccountEmail,
  generateCredentialsFilename,
} from './utils';

const secretsWarning =
  `If you are specifying input values via GitHub secrets, ensure the secret ` +
  `is being injected into the environment. By default, secrets are not ` +
  `passed to workflows triggered from forks, including Dependabot.`;

const oidcWarning =
  `GitHub Actions did not inject $ACTIONS_ID_TOKEN_REQUEST_TOKEN or ` +
  `$ACTIONS_ID_TOKEN_REQUEST_URL into this job. This most likely means the ` +
  `GitHub Actions workflow permissions are incorrect, or this job is being ` +
  `run from a fork. For more information, please see https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token`;

export async function run(logger: Logger) {
  // Warn if pinned to HEAD
  if (isPinnedToHead()) {
    logger.warning(pinnedToHeadWarning('v2'));
  }

  try {
    // Load configuration.
    const projectID = computeProjectID(
      getInput(`project_id`),
      getInput(`service_account`),
      getInput(`credentials_json`),
    );
    const workloadIdentityProvider = getInput(`workload_identity_provider`);
    const serviceAccount = computeServiceAccountEmail(
      getInput(`service_account`),
      getInput('credentials_json'),
    );
    const oidcTokenAudience =
      getInput(`audience`) || `https://iam.googleapis.com/${workloadIdentityProvider}`;
    const credentialsJSON = getInput(`credentials_json`);
    const createCredentialsFile = parseBoolean(getInput(`create_credentials_file`));
    const exportEnvironmentVariables = parseBoolean(getInput(`export_environment_variables`));
    const tokenFormat = getInput(`token_format`);
    const delegates = parseMultilineCSV(getInput(`delegates`));
    const universe = getInput(`universe`);
    const requestReason = getInput(`request_reason`);

    // Ensure exactly one of workload_identity_provider and credentials_json was
    // provided.
    if (!exactlyOneOf(workloadIdentityProvider, credentialsJSON)) {
      throw new Error(
        'The GitHub Action workflow must specify exactly one of ' +
          '"workload_identity_provider" or "credentials_json"! ' +
          secretsWarning,
      );
    }

    // Instantiate the correct client based on the provided input parameters.
    let client: AuthClient;
    if (workloadIdentityProvider) {
      logger.debug(`Using workload identity provider "${workloadIdentityProvider}"`);

      // If we're going to do the OIDC dance, we need to make sure these values
      // are set. If they aren't, core.getIDToken() will fail and so will
      // generating the credentials file.
      const oidcTokenRequestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
      const oidcTokenRequestURL = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
      if (!oidcTokenRequestToken || !oidcTokenRequestURL) {
        throw new Error(oidcWarning);
      }

      const oidcToken = await withRetries(
        async (): Promise<string> => {
          return await getIDToken(oidcTokenAudience);
        },
        { retries: 3 },
      )();
      client = new WorkloadIdentityFederationClient({
        logger: logger,
        universe: universe,
        requestReason: requestReason,

        githubOIDCToken: oidcToken,
        githubOIDCTokenRequestURL: oidcTokenRequestURL,
        githubOIDCTokenRequestToken: oidcTokenRequestToken,
        githubOIDCTokenAudience: oidcTokenAudience,
        workloadIdentityProviderName: workloadIdentityProvider,
        serviceAccount: serviceAccount,
        audience: getInput('audience'),
      });
    } else {
      logger.debug(`Using credentials JSON`);
      client = new ServiceAccountKeyClient({
        logger: logger,
        universe: universe,
        requestReason: requestReason,

        serviceAccountKey: credentialsJSON,
      });
    }

    // Always write the credentials file first, before trying to generate
    // tokens. This will ensure the file is written even if token generation
    // fails, which means continue-on-error actions will still have the file
    // available.
    if (createCredentialsFile) {
      logger.debug(`Creating credentials file`);

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
        logger.info(
          `⚠️ The "create_credentials_file" option is true, but the current ` +
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
      logger.info(`Created credentials file at "${credentialsPath}"`);

      // Output to be available to future steps.
      setOutput('credentials_file_path', credentialsPath);

      if (exportEnvironmentVariables) {
        // CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE is picked up by gcloud to
        // use a specific credential file (subject to change and equivalent to
        // auth/credential_file_override).
        exportVariable('CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE', credentialsPath);

        // GOOGLE_APPLICATION_CREDENTIALS is used by Application Default
        // Credentials in all GCP client libraries.
        exportVariable('GOOGLE_APPLICATION_CREDENTIALS', credentialsPath);

        // GOOGLE_GHA_CREDS_PATH is used by other Google GitHub Actions.
        exportVariable('GOOGLE_GHA_CREDS_PATH', credentialsPath);
      }
    }

    // Set the project ID environment variables to the computed values.
    if (!projectID) {
      logger.info(
        `⚠️ Failed to compute a project ID from the given inputs. Neither the ` +
          `"project_id" output nor any environment variables will be ` +
          `exported. If you require these values in other steps, specify the ` +
          `"project_id" input directly.`,
      );
    } else {
      setOutput('project_id', projectID);

      if (exportEnvironmentVariables) {
        exportVariable('CLOUDSDK_CORE_PROJECT', projectID);
        exportVariable('CLOUDSDK_PROJECT', projectID);
        exportVariable('GCLOUD_PROJECT', projectID);
        exportVariable('GCP_PROJECT', projectID);
        exportVariable('GOOGLE_CLOUD_PROJECT', projectID);
      }
    }

    // Attempt to generate a token. This will ensure the action correctly errors
    // if the credentials are misconfigured. This is also required so the value
    // can be set as an output for future authentication calls.
    const authToken = await client.getToken();
    logger.debug(`Successfully generated auth token`);
    setSecret(authToken);
    setOutput('auth_token', authToken);

    // Create the credential client, we might not use it, but it's basically free.
    const iamCredentialsClient = new IAMCredentialsClient({
      logger: logger,
      universe: universe,

      authToken: authToken,
    });

    switch (tokenFormat) {
      case '': {
        break;
      }
      case null: {
        break;
      }
      case 'access_token': {
        logger.debug(`Creating access token`);

        const accessTokenLifetime = parseDuration(getInput('access_token_lifetime'));
        const accessTokenScopes = parseMultilineCSV(getInput('access_token_scopes'));
        const accessTokenSubject = getInput('access_token_subject');

        // Ensure a service_account was provided if using WIF.
        if (!serviceAccount) {
          throw new Error(
            'The GitHub Action workflow must specify a "service_account" to ' +
              'use when generating an OAuth 2.0 Access Token. ' +
              secretsWarning,
          );
        }

        let accessToken: string;

        // If a subject was provided, use the traditional OAuth 2.0 flow to
        // perform Domain-Wide Delegation. Otherwise, use the modern IAM
        // Credentials endpoints.
        if (accessTokenSubject) {
          logger.debug(`Using Domain-Wide Delegation flow`);

          if (accessTokenLifetime > 3600) {
            logger.info(
              `An access token subject was specified, triggering Domain-Wide ` +
                `Delegation flow. This flow does not support specifying an ` +
                `access token lifetime of greater than 1 hour.`,
            );
          }

          const unsignedJWT = buildDomainWideDelegationJWT(
            serviceAccount,
            accessTokenSubject,
            accessTokenScopes,
            accessTokenLifetime,
          );
          const signedJWT = await client.signJWT(unsignedJWT);
          accessToken =
            await iamCredentialsClient.generateDomainWideDelegationAccessToken(signedJWT);
        } else {
          logger.debug(`Using normal access token flow`);
          accessToken = await iamCredentialsClient.generateAccessToken({
            serviceAccount,
            delegates,
            scopes: accessTokenScopes,
            lifetime: accessTokenLifetime,
          });
        }

        setSecret(accessToken);
        setOutput('access_token', accessToken);
        break;
      }
      case 'id_token': {
        logger.debug(`Creating id token`);

        const idTokenAudience = getInput('id_token_audience', { required: true });
        const idTokenIncludeEmail = parseBoolean(getInput('id_token_include_email'));

        // Ensure a service_account was provided if using WIF.
        if (!serviceAccount) {
          throw new Error(
            'The GitHub Action workflow must specify a "service_account" to ' +
              'use when generating an OAuth 2.0 Access Token. ' +
              secretsWarning,
          );
        }

        const idToken = await iamCredentialsClient.generateIDToken({
          serviceAccount,
          audience: idTokenAudience,
          delegates,
          includeEmail: idTokenIncludeEmail,
        });
        setSecret(idToken);
        setOutput('id_token', idToken);
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

if (require.main === module) {
  run(new Logger());
}
