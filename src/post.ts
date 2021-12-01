'use strict';

import { getBooleanInput, setFailed, info as logInfo } from '@actions/core';
import { removeExportedCredentials } from './utils';

/**
 * Executes the post action, documented inline.
 */
export async function run(): Promise<void> {
  try {
    const cleanupCredentials: boolean = getBooleanInput('cleanup_credentials');
    if (!cleanupCredentials) {
      return;
    }

    const exportedPath = await removeExportedCredentials();
    if (exportedPath) {
      logInfo(`Removed exported credentials at ${exportedPath}`);
    } else {
      logInfo('No exported credentials found');
    }
  } catch (err) {
    setFailed(`google-github-actions/auth post failed with: ${err}`);
  }
}

run();
