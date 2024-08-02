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

import {
  isServiceAccountKey,
  parseCredential,
  randomFilename,
} from '@google-github-actions/actions-utils';

// Do not listen to the linter - this can NOT be rewritten as an ES6 import statement.
export const { version: appVersion } = require('../package.json');

// userAgent is the default user agent.
export const userAgent = `google-github-actions:auth/${appVersion}`;

/**
 * buildDomainWideDelegationJWT constructs an _unsigned_ JWT to be used for a
 * DWD exchange. The JWT must be signed and then exchanged with the OAuth
 * endpoints for a token.
 *
 * @param serviceAccount Email address of the service account.
 * @param subject Email address to use for impersonation.
 * @param scopes List of scopes to authorize.
 * @param lifetime Number of seconds for which the JWT should be valid.
 */
export function buildDomainWideDelegationJWT(
  serviceAccount: string,
  subject: string | undefined | null,
  scopes: Array<string> | undefined | null,
  lifetime: number,
): string {
  const now = Math.floor(new Date().getTime() / 1000);

  const body: Record<string, string | number> = {
    iss: serviceAccount,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + lifetime,
  };
  if (subject && subject.trim().length > 0) {
    body.sub = subject;
  }
  if (scopes && scopes.length > 0) {
    // Yes, this is a space delimited list.
    // Not a typo, the API expects the field to be "scope" (singular).
    body.scope = scopes.join(' ');
  }

  return JSON.stringify(body);
}

/**
 * computeProjectID attempts to compute the best project ID from the given
 * inputs.
 */
export function computeProjectID(
  projectID?: string,
  serviceAccount?: string,
  serviceAccountKeyJSON?: string,
): string | undefined {
  if (projectID) {
    return projectID;
  }

  // sa-name@<project-id>.iam.gserviceaccount.com
  const fromEmail = projectIDFromServiceAccountEmail(serviceAccount);
  if (fromEmail) {
    return fromEmail;
  }

  // Extract from the key
  if (serviceAccountKeyJSON) {
    const credential = parseCredential(serviceAccountKeyJSON);
    if (isServiceAccountKey(credential) && credential.project_id) {
      return credential.project_id;
    }
  }

  return undefined;
}

/**
 * getServiceAccountEmail extracts the service account email from the given
 * fields.
 */
export function computeServiceAccountEmail(
  serviceAccountEmail?: string,
  serviceAccountKeyJSON?: string,
): string | undefined {
  if (serviceAccountEmail) {
    return serviceAccountEmail;
  }

  if (serviceAccountKeyJSON) {
    const credential = parseCredential(serviceAccountKeyJSON);
    if (isServiceAccountKey(credential) && credential.client_email) {
      return credential.client_email;
    }
  }

  return undefined;
}

/**
 * projectIDFromServiceAccountEmail attempts to extract the project ID from the
 * service account email.
 */
export function projectIDFromServiceAccountEmail(serviceAccount?: string): string | null {
  if (!serviceAccount) {
    return null;
  }

  const emailParts = serviceAccount.split('@');
  if (emailParts.length !== 2) {
    return null;
  }

  const addressParts = emailParts[1].split('.');
  if (addressParts.length < 2) {
    return null;
  }
  return addressParts[0];
}

/**
 * generateCredentialsFilename creates a predictable filename under which
 * credentials are written. This string is the filename, not the filepath. It must match the format:
 *
 *     gha-creds-[a-z0-9]{16}.json
 *
 * For example:
 *
 *     gha-creds-ef801c3bb35b52e5.json
 *
 * @return Filename
 */
export function generateCredentialsFilename(): string {
  return 'gha-creds-' + randomFilename(8) + '.json';
}
