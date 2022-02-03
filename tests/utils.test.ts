'use strict';

import 'mocha';
import { expect } from 'chai';

import { buildDomainWideDelegationJWT, generateCredentialsFilename } from '../src/utils';

describe('Utils', () => {
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

  describe('#generateCredentialsFilename', () => {
    it('returns a string matching the regex', () => {
      for (let i = 0; i < 10; i++) {
        const filename = generateCredentialsFilename();
        expect(filename).to.match(/gha-creds-[0-9a-z]{16}\.json/);
      }
    });
  });
});
