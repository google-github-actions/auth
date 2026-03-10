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

type MockMap = Record<string, unknown>;

function withMockedModule<T>(modulePath: string, mocks: MockMap): T {
  const restored = new Map<string, NodeModule | undefined>();

  try {
    for (const [request, exports] of Object.entries(mocks)) {
      const resolved = require.resolve(request);
      restored.set(resolved, require.cache[resolved]);
      require.cache[resolved] = {
        id: resolved,
        filename: resolved,
        loaded: true,
        exports,
      } as NodeModule;
    }

    const resolvedModule = require.resolve(modulePath);
    delete require.cache[resolvedModule];
    return require(resolvedModule) as T;
  } finally {
    for (const [resolved, cached] of restored.entries()) {
      if (cached) {
        require.cache[resolved] = cached;
      } else {
        delete require.cache[resolved];
      }
    }
  }
}

test('main saves credentials path for post cleanup even without env exports', async () => {
  const inputs: Record<string, string> = {
    project_id: 'my-project',
    service_account: '',
    credentials_json: '{"type":"service_account"}',
    workload_identity_provider: '',
    audience: '',
    create_credentials_file: 'true',
    export_environment_variables: 'false',
    token_format: '',
    delegates: '',
    universe: 'googleapis.com',
    request_reason: '',
  };
  const saveStateCalls: Array<[string, string]> = [];
  const setOutputCalls: Array<[string, string]> = [];
  const exportVariableCalls: Array<[string, string]> = [];

  const core = {
    exportVariable: (key: string, value: string) => {
      exportVariableCalls.push([key, value]);
    },
    getIDToken: async () => '',
    getInput: (name: string) => inputs[name] ?? '',
    saveState: (key: string, value: string) => {
      saveStateCalls.push([key, value]);
    },
    setFailed: () => {
      throw new Error('setFailed should not be called');
    },
    setOutput: (key: string, value: string) => {
      setOutputCalls.push([key, value]);
    },
    setSecret: () => {},
  };

  class FakeServiceAccountKeyClient {
    async createCredentialsFile(outputPath: string): Promise<string> {
      return outputPath;
    }

    async getToken(): Promise<string> {
      return 'auth-token';
    }
  }

  const fakeModule = withMockedModule<{ run: (logger: unknown) => Promise<void> }>('../src/main', {
    '@actions/core': core,
    '@google-github-actions/actions-utils': {
      errorMessage: (err: unknown) => String(err),
      exactlyOneOf: () => true,
      isEmptyDir: async () => false,
      isPinnedToHead: () => false,
      parseMultilineCSV: () => [],
      parseBoolean: (value: string) => value === 'true',
      parseDuration: () => 0,
      pinnedToHeadWarning: () => '',
      withRetries:
        <T extends (...args: never[]) => unknown>(fn: T) =>
        () =>
          fn(),
    },
    '../src/client/client': {
      IAMCredentialsClient: class {},
      ServiceAccountKeyClient: FakeServiceAccountKeyClient,
      WorkloadIdentityFederationClient: class {},
    },
    '../src/utils': {
      buildDomainWideDelegationJWT: () => '',
      computeProjectID: () => 'my-project',
      computeServiceAccountEmail: () => '',
      generateCredentialsFilename: () => 'gha-creds-test.json',
    },
  });

  const originalWorkspace = process.env.GITHUB_WORKSPACE;
  process.env.GITHUB_WORKSPACE = '/tmp/workspace';

  try {
    await fakeModule.run({
      debug: () => {},
      info: () => {},
      warning: () => {},
    });
  } finally {
    if (originalWorkspace === undefined) {
      delete process.env.GITHUB_WORKSPACE;
    } else {
      process.env.GITHUB_WORKSPACE = originalWorkspace;
    }
  }

  assert.deepStrictEqual(saveStateCalls, [['credentialsPath', '/tmp/workspace/gha-creds-test.json']]);
  assert.ok(
    setOutputCalls.some(
      ([key, value]) => key === 'credentials_file_path' && value === '/tmp/workspace/gha-creds-test.json',
    ),
  );
  assert.deepStrictEqual(exportVariableCalls, []);
});

test('post removes credentials file from saved state when env export is disabled', async () => {
  const removedPaths: string[] = [];

  const postModule = withMockedModule<{ run: (logger: unknown) => Promise<void> }>('../src/post', {
    '@actions/core': {
      getInput: (name: string) => {
        if (name === 'create_credentials_file' || name === 'cleanup_credentials') {
          return 'true';
        }
        return '';
      },
      getState: (name: string) => (name === 'credentialsPath' ? '/tmp/gha-creds-test.json' : ''),
      setFailed: () => {
        throw new Error('setFailed should not be called');
      },
    },
    '@google-github-actions/actions-utils': {
      errorMessage: (err: unknown) => String(err),
      forceRemove: async (path: string) => {
        removedPaths.push(path);
      },
      parseBoolean: (value: string) => value === 'true',
    },
  });

  const previousEnv = process.env.GOOGLE_GHA_CREDS_PATH;
  delete process.env.GOOGLE_GHA_CREDS_PATH;

  try {
    await postModule.run({
      info: () => {},
    });
  } finally {
    if (previousEnv === undefined) {
      delete process.env.GOOGLE_GHA_CREDS_PATH;
    } else {
      process.env.GOOGLE_GHA_CREDS_PATH = previousEnv;
    }
  }

  assert.deepStrictEqual(removedPaths, ['/tmp/gha-creds-test.json']);
});
