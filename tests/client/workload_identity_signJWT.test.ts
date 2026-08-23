import { test } from 'node:test';
import assert from 'node:assert';

import { Logger } from '../../src/logger';
import { WorkloadIdentityFederationClient } from '../../src/client/workload_identity_federation';

// Extended RecordingLogger that captures the actual objects passed to debug()
// not just string representations
class StructuredRecordingLogger extends Logger {
  readonly messages: string[] = [];
  readonly debugCalls: any[] = [];

  withNamespace(): Logger {
    return this;
  }

  debug(...args: any[]) {
    // Capture both the string form (for general debugging) and the structured form
    this.messages.push(args.join(' '));
    this.debugCalls.push(args);
  }

  warning(...args: any[]) {
    this.messages.push(args.join(' '));
  }
}

test('#signJWT does not leak access token in logs', { concurrency: true }, async (suite) => {
  await suite.test('sanitizes Authorization header before logging', async () => {
    const SUPER_SECRET_ACCESS_TOKEN = 'SUPER_SECRET_ACCESS_TOKEN_123456';

    const logger = new StructuredRecordingLogger();
    const client = new WorkloadIdentityFederationClient({
      logger,
      universe: 'googleapis.com',
      requestReason: 'test-request-reason',
      githubOIDCToken: 'test-oidc-token',
      githubOIDCTokenRequestURL: 'https://example.com/',
      githubOIDCTokenRequestToken: 'test-authorization-token',
      githubOIDCTokenAudience: 'test-audience',
      workloadIdentityProviderName:
        'projects/123/locations/global/workloadIdentityPools/pool/providers/provider',
      serviceAccount: 'test-service@example.com',
    });

    // Mock getToken to return our secret token
    let getTokenCalls = 0;
    Object.defineProperty(client, 'getToken', {
      value: async () => {
        getTokenCalls++;
        return SUPER_SECRET_ACCESS_TOKEN;
      },
    });

    // Mock httpClient to capture the request and track what was sent
    let httpClientCalls = 0;
    let capturedHeaders: any = null;
    Object.defineProperty(client, '_httpClient', {
      value: {
        postJson: async (_path: string, _body: any, headers: any) => {
          httpClientCalls++;
          capturedHeaders = headers;
          return {
            statusCode: 200,
            result: { signedJwt: 'test-signed-jwt' },
          };
        },
      },
    });

    // Call signJWT
    const result = await client.signJWT({ test: 'claims' });

    // Verify getToken was called
    assert.strictEqual(getTokenCalls, 1, 'getToken should be called once');

    // Verify httpClient was called
    assert.strictEqual(httpClientCalls, 1, 'httpClient.postJson should be called once');

    // Verify the result
    assert.strictEqual(result, 'test-signed-jwt', 'signJWT should return the signed JWT');

    // Verify HTTP client received the REAL token in Authorization header
    assert.ok(capturedHeaders, 'httpClient should receive headers');
    assert.ok(capturedHeaders.Authorization, 'Authorization header should be present');
    assert.ok(
      capturedHeaders.Authorization.includes(SUPER_SECRET_ACCESS_TOKEN),
      `HTTP client should receive real token. Got: ${capturedHeaders.Authorization}`,
    );

    // Verify logger did NOT receive the real token in plain text
    const allLoggerOutput = logger.messages.join('\n');
    assert.ok(
      !allLoggerOutput.includes(SUPER_SECRET_ACCESS_TOKEN),
      `Logger output should NOT contain the secret token`,
    );

    // Verify logger received sanitized headers
    // The logger.debug() should have been called with an object containing sanitized headers
    const debugCallWithRequest = logger.debugCalls.find(
      (call: any[]) =>
        call.length > 0 && typeof call[0] === 'string' && call[0].includes('Built request'),
    );

    assert.ok(debugCallWithRequest, 'debug() should be called with "Built request" message');
    assert.strictEqual(debugCallWithRequest.length, 2, 'debug() should be called with 2 arguments');

    const debugObject = debugCallWithRequest[1];
    assert.ok(debugObject, 'Second argument to debug() should be the request object');
    assert.ok(debugObject.headers, 'Request object should have headers');

    // Most importantly: the headers passed to logger should have [REDACTED]
    assert.ok(
      debugObject.headers.Authorization === '[REDACTED]',
      `Logger should receive sanitized Authorization header. Got: ${debugObject.headers.Authorization}`,
    );

    // The logger should NOT see the real token anywhere in the headers object
    assert.ok(
      !JSON.stringify(debugObject.headers).includes(SUPER_SECRET_ACCESS_TOKEN),
      'Logger headers object should not contain the secret token',
    );

    // Verify other parts of the request are correct
    assert.strictEqual(debugObject.method, 'POST', 'Method should be POST');
    assert.ok(debugObject.path.includes('signJwt'), 'Path should include signJwt');
    assert.deepStrictEqual(
      debugObject.body,
      { payload: { test: 'claims' } },
      'Body should contain claims',
    );
  });
});
