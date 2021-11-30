'use strict';

import 'mocha';
import { expect } from 'chai';

import { tmpdir } from 'os';
import { existsSync } from 'fs';

import { removeExportedCredentials } from '../src/utils';
import { writeSecureFile } from '../src/utils';

describe('post', () => {
  describe('#removeExportedCredentials', () => {
    it('does nothing when GOOGLE_GHA_CREDS_PATH is unset', async () => {
      delete process.env.GOOGLE_GHA_CREDS_PATH;
      const pth = await removeExportedCredentials();
      expect(pth).to.eq('');
    });

    it('deletes the file', async () => {
      const filePath = await writeSecureFile(tmpdir(), 'my data');
      process.env.GOOGLE_GHA_CREDS_PATH = filePath;
      const pth = await removeExportedCredentials();
      expect(existsSync(filePath)).to.be.false;
      expect(pth).to.eq(filePath);
    });

    it('does not fail if the file does not exist', async () => {
      const filePath = '/not/a/file';
      process.env.GOOGLE_GHA_CREDS_PATH = filePath;
      const pth = await removeExportedCredentials();
      expect(pth).to.eq('');
    });
  });
});
