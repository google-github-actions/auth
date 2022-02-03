'use strict';

import { createSign } from 'crypto';
import {
  isServiceAccountKey,
  parseCredential,
  ServiceAccountKey,
  toBase64,
  writeSecureFile,
} from '@google-github-actions/actions-utils';

import { AuthClient } from './auth_client';

/**
 * Available options to create the CredentialsJSONClient.
 *
 * @param projectID User-supplied value for project ID. If not provided, the
 * project ID is extracted from the credentials JSON.
 * @param credentialsJSON Raw JSON credentials blob.
 */
interface CredentialsJSONClientOptions {
  projectID?: string;
  credentialsJSON: string;
}

/**
 * CredentialsJSONClient is a client that accepts a service account key JSON
 * credential.
 */
export class CredentialsJSONClient implements AuthClient {
  readonly #projectID: string;
  readonly #credentials: ServiceAccountKey;

  constructor(opts: CredentialsJSONClientOptions) {
    const credentials = parseCredential(opts.credentialsJSON);
    if (!isServiceAccountKey(credentials)) {
      throw new Error(`Provided credential is not a valid service account key JSON`);
    }
    this.#credentials = credentials;

    this.#projectID = opts.projectID || this.#credentials.project_id;
  }

  /**
   * getAuthToken generates a token capable of calling the iamcredentials API.
   */
  async getAuthToken(): Promise<string> {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: this.#credentials.private_key_id,
    };

    const now = Math.floor(new Date().getTime() / 1000);

    const body = {
      iss: this.#credentials.client_email,
      sub: this.#credentials.client_email,
      aud: 'https://iamcredentials.googleapis.com/',
      iat: now,
      exp: now + 3599,
    };

    const message = toBase64(JSON.stringify(header)) + '.' + toBase64(JSON.stringify(body));

    try {
      const signer = createSign('RSA-SHA256');
      signer.write(message);
      signer.end();

      const signature = signer.sign(this.#credentials.private_key);
      return message + '.' + toBase64(signature);
    } catch (err) {
      throw new Error(`Failed to sign auth token using ${await this.getServiceAccount()}: ${err}`);
    }
  }

  /**
   * signJWT signs the given JWT with the private key.
   *
   * @param unsignedJWT The JWT to sign.
   */
  async signJWT(unsignedJWT: string): Promise<string> {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: this.#credentials.private_key_id,
    };

    const message = toBase64(JSON.stringify(header)) + '.' + toBase64(unsignedJWT);

    try {
      const signer = createSign('RSA-SHA256');
      signer.write(message);
      signer.end();

      const signature = signer.sign(this.#credentials.private_key);
      const jwt = message + '.' + toBase64(signature);
      return jwt;
    } catch (err) {
      throw new Error(`Failed to sign JWT using ${await this.getServiceAccount()}: ${err}`);
    }
  }

  /**
   * getProjectID returns the project ID. If an override was given, the override
   * is returned. Otherwise, this will be the project ID that was extracted from
   * the service account key JSON.
   */
  async getProjectID(): Promise<string> {
    return this.#projectID;
  }

  /**
   * getServiceAccount returns the service account email for the authentication,
   * extracted from the Service Account Key JSON.
   */
  async getServiceAccount(): Promise<string> {
    return this.#credentials.client_email;
  }

  /**
   * createCredentialsFile creates a Google Cloud credentials file that can be
   * set as GOOGLE_APPLICATION_CREDENTIALS for gcloud and client libraries.
   */
  async createCredentialsFile(outputPath: string): Promise<string> {
    return await writeSecureFile(outputPath, JSON.stringify(this.#credentials));
  }
}
