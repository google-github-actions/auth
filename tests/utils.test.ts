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

import { test } from 'node:test';
import assert from 'node:assert';

import {
  buildDomainWideDelegationJWT,
  computeProjectID,
  computeServiceAccountEmail,
  generateCredentialsFilename,
  projectIDFromServiceAccountEmail,
} from '../src/utils';

test('#buildDomainWideDelegationJWT', { concurrency: true }, async (suite) => {
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

  for await (const tc of cases) {
    await suite.test(tc.name, async () => {
      const val = buildDomainWideDelegationJWT(
        tc.serviceAccount,
        tc.subject,
        tc.scopes,
        tc.lifetime,
      );

      const body = JSON.parse(val);
      assert.deepStrictEqual(body.iss, tc.serviceAccount);
      assert.deepStrictEqual(body.aud, 'https://oauth2.googleapis.com/token');
      assert.deepStrictEqual(body.sub, tc.subject);
      assert.deepStrictEqual(body.scope, tc.scopes?.join(' '));
    });
  }
});

test('#computeProjectID', { concurrency: true }, async (suite) => {
  const cases = [
    {
      name: 'directly given',
      projectID: 'my-project',
      exp: 'my-project',
    },
    {
      name: 'from service account email',
      serviceAccountEmail: 'my-account@my-project.iam.gserviceaccount.com',
      exp: 'my-project',
    },
    {
      name: 'from json credential',
      serviceAccountKeyJSON: '{"type":"service_account", "project_id": "my-project"}',
      exp: 'my-project',
    },
    {
      name: 'from json credential invalid',
      serviceAccountKeyJSON: '{"nope": "foo@bar.com"}',
      exp: undefined,
    },
  ];

  for await (const tc of cases) {
    await suite.test(tc.name, async () => {
      const result = computeProjectID(
        tc.projectID,
        tc.serviceAccountEmail,
        tc.serviceAccountKeyJSON,
      );
      assert.deepStrictEqual(result, tc.exp);
    });
  }
});

test('#computeServiceAccountEmail', { concurrency: true }, async (suite) => {
  const cases = [
    {
      name: 'directly given',
      serviceAccountEmail: 'foo@bar.com',
      exp: 'foo@bar.com',
    },
    {
      name: 'from json credential',
      serviceAccountKeyJSON: '{"type":"service_account", "client_email": "foo@bar.com"}',
      exp: 'foo@bar.com',
    },
    {
      name: 'invalid json credential',
      serviceAccountKeyJSON: '{"nope": "foo@bar.com"}',
      exp: undefined,
    },
    {
      name: 'nothing',
      exp: undefined,
    },
  ];

  for await (const tc of cases) {
    await suite.test(tc.name, async () => {
      const result = computeServiceAccountEmail(tc.serviceAccountEmail, tc.serviceAccountKeyJSON);
      assert.deepStrictEqual(result, tc.exp);
    });
  }
});

test('#projectIDFromServiceAccountEmail', { concurrency: true }, async (suite) => {
  const cases = [
    {
      name: 'empty',
      input: '',
      exp: null,
    },
    {
      name: 'not an email',
      input: 'not a service account',
      exp: null,
    },
    {
      name: 'invalid email',
      input: 'foo@abc',
      exp: null,
    },
    {
      name: 'returns project',
      input: 'test-sa@my-project.iam.gserviceaccount.com',
      exp: 'my-project',
    },
  ];

  for await (const tc of cases) {
    await suite.test(tc.name, async () => {
      const result = projectIDFromServiceAccountEmail(tc.input);
      assert.deepStrictEqual(result, tc.exp);
    });
  }
});

test('#generateCredentialsFilename', { concurrency: true }, async (suite) => {
  await suite.test('returns a string matching the regex', () => {
    for (let i = 0; i < 10; i++) {
      const filename = generateCredentialsFilename();
      assert.match(filename, /gha-creds-[0-9a-z]{16}\.json/);
    }
  });
});
