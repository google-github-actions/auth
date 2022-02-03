'use strict';

import 'mocha';
import { expect } from 'chai';

import { tmpdir } from 'os';
import { join as pathjoin } from 'path';
import { readFileSync } from 'fs';

import { randomFilename } from '@google-github-actions/actions-utils';

import { WorkloadIdentityClient } from '../../src/client/workload_identity_client';

describe('WorkloadIdentityClient', () => {
  describe('#getProjectID', () => {
    it('extracts project ID from the service account email', async () => {
      const client = new WorkloadIdentityClient({
        providerID: 'my-provider',
        token: 'my-token',
        serviceAccount: 'my-service@my-project.iam.gserviceaccount.com',
        audience: 'my-aud',
        oidcTokenRequestURL: 'https://example.com/',
        oidcTokenRequestToken: 'token',
      });

      const result = await client.getProjectID();
      expect(result).to.eq('my-project');
    });

    it('prefers the override if given', async () => {
      const client = new WorkloadIdentityClient({
        projectID: 'my-other-project',
        providerID: 'my-provider',
        token: 'my-token',
        serviceAccount: 'my-service@my-project.iam.gserviceaccount.com',
        audience: 'my-aud',
        oidcTokenRequestURL: 'https://example.com/',
        oidcTokenRequestToken: 'token',
      });

      const result = await client.getProjectID();
      expect(result).to.eq('my-other-project');
    });

    it('throws an error when extraction fails', async () => {
      const fn = () => {
        return new WorkloadIdentityClient({
          providerID: 'my-provider',
          token: 'my-token',
          serviceAccount: 'my-service@developers.google.com',
          audience: 'my-aud',
          oidcTokenRequestURL: 'https://example.com/',
          oidcTokenRequestToken: 'token',
        });
      };
      return expect(fn).to.throw(Error);
    });
  });

  describe('#getServiceAccount', () => {
    it('returns the provided value', async () => {
      const client = new WorkloadIdentityClient({
        projectID: 'my-project',
        providerID: 'my-provider',
        serviceAccount: 'my-service@my-project.iam.gserviceaccount.com',
        token: 'my-token',
        audience: 'my-aud',
        oidcTokenRequestURL: 'https://example.com/',
        oidcTokenRequestToken: 'token',
      });
      const result = await client.getServiceAccount();
      expect(result).to.eq('my-service@my-project.iam.gserviceaccount.com');
    });
  });

  describe('#createCredentialsFile', () => {
    it('writes the file', async () => {
      const outputFile = pathjoin(tmpdir(), randomFilename());
      const client = new WorkloadIdentityClient({
        projectID: 'my-project',
        providerID: 'my-provider',
        serviceAccount: 'my-service@my-project.iam.gserviceaccount.com',
        token: 'my-token',
        audience: 'my-aud',
        oidcTokenRequestURL: 'https://example.com/',
        oidcTokenRequestToken: 'token',
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

      expect(got).to.deep.equal(exp);
    });
  });
});
