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

import { test, TestContext } from 'node:test';
import assert from 'node:assert';

import { tmpdir } from 'os';
import { join as pathjoin } from 'path';
import { readFileSync } from 'fs';

import { randomFilename } from '@google-github-actions/actions-utils';

import { Logger, NullLogger } from '../../src/logger';
import { WorkloadIdentityFederationClient } from '../../src/client/workload_identity_federation';

class RecordingLogger extends Logger {
  readonly messages: string[] = [];

  withNamespace(): Logger {
    return this;
  }

  debug(...args: any[]) {
    this.messages.push(args.join(' '));
  }

  warning(...args: any[]) {
    this.messages.push(args.join(' '));
  }
}

function workloadIdentityClient(
  logger: Logger = new NullLogger(),
): WorkloadIdentityFederationClient {
  return new WorkloadIdentityFederationClient({
    logger,
    universe: 'googleapis.com',
    requestReason: 'sensitive-request-reason',
    githubOIDCToken: 'sensitive-oidc-assertion',
    githubOIDCTokenRequestURL: 'https://example.com/',
    githubOIDCTokenRequestToken: 'sensitive-authorization-token',
    githubOIDCTokenAudience: 'sensitive-audience',
    workloadIdentityProviderName:
      'projects/123/locations/global/workloadIdentityPools/pool/providers/provider',
    serviceAccount: 'sensitive-service-account@example.com',
  });
}

function mockTokenExchange(
  client: WorkloadIdentityFederationClient,
  outcomes: Array<object | Error>,
): () => number {
  let calls = 0;
  Object.defineProperty(client, '_httpClient', {
    value: {
      postJson: async () => {
        const outcome = outcomes[calls++];
        if (outcome instanceof Error) {
          throw outcome;
        }
        return outcome;
      },
    },
  });
  return () => calls;
}

function httpError(statusCode: number, result?: object): Error {
  return Object.assign(new Error(`sensitive response body for ${statusCode}`), {
    statusCode,
    result,
  });
}

function mockTimeouts(context: TestContext): number[] {
  const delays: number[] = [];
  context.mock.method(globalThis, 'setTimeout', ((callback: () => void, delay?: number) => {
    delays.push(delay ?? 0);
    callback();
    return {} as NodeJS.Timeout;
  }) as typeof setTimeout);
  return delays;
}

test('#getToken retries transient STS responses', async (suite) => {
  mockTimeouts(suite);
  for (const statusCode of [408, 429, 500, 502, 503, 504]) {
    await suite.test(`retries HTTP ${statusCode}`, async () => {
      const client = workloadIdentityClient();
      const calls = mockTokenExchange(client, [
        httpError(statusCode),
        { statusCode: 200, result: { access_token: 'sensitive-access-token' } },
      ]);

      assert.strictEqual(await client.getToken(), 'sensitive-access-token');
      assert.strictEqual(calls(), 2);
    });
  }

  for (const code of ['EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT']) {
    await suite.test(`retries ${code}`, async () => {
      const client = workloadIdentityClient();
      const clientError = Object.assign(new Error('sensitive connection details'), { code });
      const calls = mockTokenExchange(client, [
        clientError,
        { statusCode: 200, result: { access_token: 'sensitive-access-token' } },
      ]);

      assert.strictEqual(await client.getToken(), 'sensitive-access-token');
      assert.strictEqual(calls(), 2);
    });
  }

  await suite.test('retries the @actions/http-client socket timeout', async () => {
    const client = workloadIdentityClient();
    const calls = mockTokenExchange(client, [
      new Error('Request timeout: /v1/token'),
      { statusCode: 200, result: { access_token: 'sensitive-access-token' } },
    ]);

    assert.strictEqual(await client.getToken(), 'sensitive-access-token');
    assert.strictEqual(calls(), 2);
  });
});

test('#getToken does not retry permanent STS responses', async (suite) => {
  for (const statusCode of [400, 401, 403]) {
    await suite.test(`fails after HTTP ${statusCode}`, async () => {
      const client = workloadIdentityClient();
      const calls = mockTokenExchange(client, [httpError(statusCode)]);

      await assert.rejects(client.getToken(), (err: Error) => {
        assert.match(err.message, new RegExp(`status=${statusCode}`));
        assert.match(err.message, /error_class=non_retryable_http_response/);
        assert.match(err.message, /attempt=1\/4/);
        return true;
      });
      assert.strictEqual(calls(), 1);
    });
  }
});

test('#getToken includes selected STS response details in the final error', async (suite) => {
  await suite.test('uses error_description and normalizes line breaks', async () => {
    const client = workloadIdentityClient();
    mockTokenExchange(client, [
      httpError(400, {
        error_description: 'invalid subject token\nfor audience',
        error: { message: 'nested message should not be used' },
      }),
    ]);

    await assert.rejects(client.getToken(), /response_message=invalid subject token for audience$/);
  });

  await suite.test('falls back to error.message', async () => {
    const client = workloadIdentityClient();
    mockTokenExchange(client, [httpError(400, { error: { message: 'nested STS error message' } })]);

    await assert.rejects(client.getToken(), /response_message=nested STS error message$/);
  });
});

test('#getToken emits sanitized attempt diagnostics', async (context) => {
  mockTimeouts(context);
  const logger = new RecordingLogger();
  const client = workloadIdentityClient(logger);
  const calls = mockTokenExchange(client, [
    httpError(500, {
      error_description: 'retryable STS error',
      ignored: 'sensitive response body',
    }),
    httpError(400, {
      error: { message: 'terminal STS error' },
      ignored: 'sensitive response body',
    }),
  ]);

  let finalError = '';
  await assert.rejects(client.getToken(), (err: Error) => {
    finalError = err.message;
    return true;
  });
  assert.strictEqual(calls(), 2);
  assert.deepStrictEqual(logger.messages, [
    'STS request failed: operation=token_exchange, endpoint_class=sts.googleapis.com, status=500, error_class=transient_http_response, attempt=1/4',
    'STS request failed: operation=token_exchange, endpoint_class=sts.googleapis.com, status=400, error_class=non_retryable_http_response, attempt=2/4',
  ]);
  assert.match(finalError, /response_message=terminal STS error$/);

  const diagnostics = [...logger.messages, finalError].join('\n');
  for (const secret of [
    'sensitive-oidc-assertion',
    'sensitive-access-token',
    'sensitive-authorization-token',
    'sensitive-request-reason',
    'sensitive-service-account@example.com',
    'projects/123/locations/global/workloadIdentityPools/pool/providers/provider',
    'sensitive response body',
    'retryable STS error',
  ]) {
    assert.ok(!diagnostics.includes(secret), `diagnostics included ${secret}`);
  }
});

test('#getToken bounds transient STS retries with exponential backoff', async (context) => {
  const delays = mockTimeouts(context);
  const client = workloadIdentityClient();
  const calls = mockTokenExchange(client, [
    httpError(503),
    httpError(503),
    httpError(503),
    httpError(503),
  ]);

  await assert.rejects(client.getToken(), /attempt=4\/4/);
  assert.strictEqual(calls(), 4);
  assert.deepStrictEqual(delays, [500, 1000, 2000]);
});

test('#createCredentialsFile', { concurrency: true }, async (suite) => {
  await suite.test('writes the file', async () => {
    const outputFile = pathjoin(tmpdir(), randomFilename());
    const client = new WorkloadIdentityFederationClient({
      logger: new NullLogger(),
      universe: 'googleapis.com',

      githubOIDCToken: 'my-token',
      githubOIDCTokenRequestURL: 'https://example.com/',
      githubOIDCTokenRequestToken: 'token',
      githubOIDCTokenAudience: 'my-aud',
      workloadIdentityProviderName: 'my-provider',
    });

    const exp = {
      audience: '//iam.googleapis.com/my-provider',
      credential_source: {
        format: {
          subject_token_field_name: 'value',
          type: 'json',
        },
        headers: {
          Authorization: 'Bearer token',
        },
        url: 'https://example.com/?audience=my-aud',
      },
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      token_url: 'https://sts.googleapis.com/v1/token',
      type: 'external_account',
    };

    const pth = await client.createCredentialsFile(outputFile);
    const data = readFileSync(pth);
    const got = JSON.parse(data.toString('utf8'));

    assert.deepStrictEqual(got, exp);
  });

  await suite.test('writes the file with impersonation', async () => {
    const outputFile = pathjoin(tmpdir(), randomFilename());
    const client = new WorkloadIdentityFederationClient({
      logger: new NullLogger(),
      universe: 'googleapis.com',

      githubOIDCToken: 'my-token',
      githubOIDCTokenRequestURL: 'https://example.com/',
      githubOIDCTokenRequestToken: 'token',
      githubOIDCTokenAudience: 'my-aud',
      workloadIdentityProviderName: 'my-provider',
      serviceAccount: 'my-service@my-project.iam.gserviceaccount.com',
    });

    const exp = {
      audience: '//iam.googleapis.com/my-provider',
      credential_source: {
        format: {
          subject_token_field_name: 'value',
          type: 'json',
        },
        headers: {
          Authorization: 'Bearer token',
        },
        url: 'https://example.com/?audience=my-aud',
      },
      service_account_impersonation_url:
        'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/my-service@my-project.iam.gserviceaccount.com:generateAccessToken',
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      token_url: 'https://sts.googleapis.com/v1/token',
      type: 'external_account',
    };

    const pth = await client.createCredentialsFile(outputFile);
    const data = readFileSync(pth);
    const got = JSON.parse(data.toString('utf8'));

    assert.deepStrictEqual(got, exp);
  });
});
