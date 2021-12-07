'use strict';

import 'mocha';
import { expect } from 'chai';

import { tmpdir } from 'os';
import { existsSync, readFileSync } from 'fs';

import {
  buildDomainWideDelegationJWT,
  explodeStrings,
  fromBase64,
  parseDuration,
  removeExportedCredentials,
  toBase64,
  trimmedString,
  writeSecureFile,
} from '../src/utils';

describe('Utils', () => {
  describe('#writeSecureFile', () => {
    it('writes data to the file', async () => {
      const tmp = tmpdir();
      const filePath = await writeSecureFile(tmp, 'hi');
      expect(existsSync(filePath)).to.be.true;
      expect(readFileSync(filePath).toString('utf8')).to.eq('hi');
    });

    it('generates a random name', async () => {
      const tmp = tmpdir();
      const filePath1 = await writeSecureFile(tmp, 'hi');
      const filePath2 = await writeSecureFile(tmp, 'bye');
      expect(filePath1).to.not.eq(filePath2);
      expect(filePath1).to.not.eq(filePath2);
    });
  });

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

  describe('#explodeStrings', () => {
    const cases = [
      {
        name: 'empty string',
        input: '',
        expected: [],
      },
      {
        name: 'padded empty string',
        input: ' ',
        expected: [],
      },
      {
        name: 'comma-separated',
        input: 'hello , world , and goodbye',
        expected: ['hello', 'world', 'and goodbye'],
      },
      {
        name: 'newline-separated',
        input: `
      hello
      world
      and goodbye`,
        expected: ['hello', 'world', 'and goodbye'],
      },
      {
        name: 'comma and newline-separated',
        input: `
      hello,
      world,
      and goodbye,`,
        expected: ['hello', 'world', 'and goodbye'],
      },
      {
        name: 'comma-escaped',
        input: 'hello , world , and\\, goodbye',
        expected: ['hello', 'world', 'and, goodbye'],
      },
    ];

    cases.forEach((tc) => {
      it(tc.name, async () => {
        expect(explodeStrings(tc.input)).to.eql(tc.expected);
      });
    });
  });

  describe('#toBase64', () => {
    const cases = [
      {
        name: 'empty string',
        input: '',
        expected: '',
      },
      {
        name: 'empty buffer',
        input: Buffer.from(''),
        expected: '',
      },
      {
        name: 'encodes string',
        input: 'hello',
        expected: 'aGVsbG8',
      },
      {
        name: 'encodes buffer',
        input: Buffer.from('hello'),
        expected: 'aGVsbG8',
      },
    ];

    cases.forEach((tc) => {
      it(tc.name, async () => {
        expect(toBase64(tc.input)).to.eq(tc.expected);
      });
    });
  });

  describe('#fromBase64', () => {
    const cases = [
      {
        name: 'decodes',
        input: 'aGVsbG8',
        expected: 'hello',
      },
      {
        name: 'decodes padded',
        input: 'aGVsbG8==',
        expected: 'hello',
      },
      {
        name: 'decodes semi-padded',
        input: 'aGVsbG8=',
        expected: 'hello',
      },
    ];

    cases.forEach((tc) => {
      it(tc.name, async () => {
        expect(fromBase64(tc.input)).to.eq(tc.expected);
      });
    });
  });

  describe('#trimmedString', () => {
    const cases = [
      {
        name: 'null',
        input: null,
        expected: '',
      },
      {
        name: 'undefined',
        input: undefined,
        expected: '',
      },
      {
        name: 'empty string',
        input: '',
        expected: '',
      },
      {
        name: 'trims',
        input: ' hello world  ',
        expected: 'hello world',
      },
    ];

    cases.forEach((tc) => {
      it(tc.name, async () => {
        expect(trimmedString(tc.input)).to.eq(tc.expected);
      });
    });
  });

  describe('#parseDuration', () => {
    const cases = [
      {
        name: 'empty string',
        input: '',
        expected: 0,
      },
      {
        name: 'unitless',
        input: '149585',
        expected: 149585,
      },
      {
        name: 'with commas',
        input: '149,585',
        expected: 149585,
      },
      {
        name: 'suffix seconds',
        input: '149585s',
        expected: 149585,
      },
      {
        name: 'suffix minutes',
        input: '25m',
        expected: 1500,
      },
      {
        name: 'suffix hours',
        input: '12h',
        expected: 43200,
      },
      {
        name: 'suffix hours minutes seconds',
        input: '12h10m55s',
        expected: 43855,
      },
      {
        name: 'commas and spaces',
        input: '12h, 10m 55s',
        expected: 43855,
      },
      {
        name: 'invalid',
        input: '12h blueberries',
        error: 'Unsupported character "b" at position 4',
      },
    ];

    cases.forEach((tc) => {
      it(tc.name, async () => {
        if (tc.expected) {
          expect(parseDuration(tc.input)).to.eq(tc.expected);
        } else if (tc.error) {
          expect(() => {
            parseDuration(tc.input);
          }).to.throw(tc.error);
        }
      });
    });
  });

  describe('#buildDomainWideDelegationJWT', () => {
    const cases = [
      {
        name: 'default',
        serviceAccount: 'my-service@example.com',
        lifetime: 1000,
      },
      {
        name: 'with subject',
        serviceAccount: 'my-service@example.com',
        subject: 'my-subject',
        lifetime: 1000,
      },
      {
        name: 'with scopes',
        serviceAccount: 'my-service@example.com',
        scopes: ['scope1', 'scope2'],
        lifetime: 1000,
      },
    ];

    cases.forEach((tc) => {
      it(tc.name, async () => {
        const val = buildDomainWideDelegationJWT(
          tc.serviceAccount,
          tc.subject,
          tc.scopes,
          tc.lifetime,
        );

        const body = JSON.parse(val);
        expect(body.iss).to.eq(tc.serviceAccount);
        expect(body.aud).to.eq('https://oauth2.googleapis.com/token');

        if (tc.subject) {
          expect(body.sub).to.eq(tc.subject);
        } else {
          expect(body.sub).to.not.be;
        }

        if (tc.scopes) {
          expect(body.scope).to.eq(tc.scopes.join(' '));
        } else {
          expect(body.scope).to.not.be;
        }
      });
    });
  });
});
