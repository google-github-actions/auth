'use strict';

import 'mocha';
import { expect } from 'chai';

import { tmpdir } from 'os';
import { existsSync } from 'fs';

import { removeCachedCredentials } from '../src/utils';
import { writeSecureFile } from '../src/utils';

describe('post', () => {
  describe('#removeCachedCredentials', () => {
    it('does nothing when GOOGLE_GHA_CREDS_PATH is unset', async () => {
      delete process.env.GOOGLE_GHA_CREDS_PATH;
      await removeCachedCredentials();
    });

    it('deletes the file', async () => {
      const filePath = await writeSecureFile(tmpdir(), 'my data');
      process.env.GOOGLE_GHA_CREDS_PATH = filePath;
      await removeCachedCredentials();
      expect(existsSync(filePath)).to.be.false;
    });
  });
});
