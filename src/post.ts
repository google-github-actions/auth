'use strict';

import { getBooleanInput, setFailed } from '@actions/core';
import { removeCachedCredentials } from './utils';

/**
 * Executes the post action, documented inline.
 */
export async function run(): Promise<void> {
  try {
    const cleanupCredentials: boolean = getBooleanInput('cleanup_credentials');
    if (cleanupCredentials) {
      return;
    }

    await removeCachedCredentials();
  } catch (err) {
    setFailed(`google-github-actions/auth post failed with: ${err}`);
  }
}

run();
