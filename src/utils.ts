'use strict';

import { randomFilename } from '@google-github-actions/actions-utils';

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
