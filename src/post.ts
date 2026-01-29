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

import { getInput, getState, setFailed } from '@actions/core';

import { errorMessage, forceRemove, parseBoolean } from '@google-github-actions/actions-utils';

import { Logger } from './logger';

export async function run(logger: Logger) {
  try {
    const createCredentials = parseBoolean(getInput('create_credentials_file'));
    if (!createCredentials) {
      logger.info(`Skipping credential cleanup - "create_credentials_file" is false.`);
      return;
    }

    const cleanupCredentials = parseBoolean(getInput('cleanup_credentials'));
    if (!cleanupCredentials) {
      logger.info(`Skipping credential cleanup - "cleanup_credentials" is false.`);
      return;
    }

    // Look up the credentials path from the state saved by the main action.
    // We use state instead of environment variables to avoid accidentally
    // cleaning up credentials that were set manually by the user.
    const credentialsPath = getState('credentials_file_path');
    if (!credentialsPath) {
      logger.info(`Skipping credential cleanup - credentials file path is not set.`);
      return;
    }

    // Remove the file.
    await forceRemove(credentialsPath);
    logger.info(`Removed exported credentials at "${credentialsPath}".`);
  } catch (err) {
    const msg = errorMessage(err);
    setFailed(`google-github-actions/auth post failed with: ${msg}`);
  }
}

if (require.main === module) {
  run(new Logger());
}
