'use strict';

import { getBooleanInput, setFailed, info as logInfo } from '@actions/core';
import { errorMessage, removeFile } from '@google-github-actions/actions-utils';

/**
 * Executes the post action, documented inline.
 */
export async function run(): Promise<void> {
  try {
    const cleanupCredentials: boolean = getBooleanInput('cleanup_credentials');
    if (!cleanupCredentials) {
      return;
    }

    // Look up the credentials path, if one exists. Note that we only check the
    // environment variable set by our action, since we don't want to
    // accidentially clean up if someone set GOOGLE_APPLICATION_CREDENTIALS or
    // another environment variable manually.
    const credentialsPath = process.env['GOOGLE_GHA_CREDS_PATH'];
    if (!credentialsPath) {
      return;
    }

    // Remove the file.
    const removed = await removeFile(credentialsPath);
    if (removed) {
      logInfo(`Removed exported credentials at ${credentialsPath}`);
    } else {
      logInfo('No exported credentials found');
    }
  } catch (err) {
    const msg = errorMessage(err);
    setFailed(`google-github-actions/auth post failed with: ${msg}`);
  }
}

run();
