'use strict';

import { createSign } from 'crypto';
import { AuthClient } from './auth_client';
import { toBase64, fromBase64, trimmedString, writeSecureFile } from '../utils';

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
 * ServiceAccountKey is an interface that represents the minimial number of
 * fields required to be considered a Google Cloud service account key JSON.
 * There may be other fields, but they are not required for this client.
 *
 * @param projectID Project where the service account resides.
 * @param clientEmail Service account email address.
 * @param privateKeyID Unique identifier for the private key.
 * @param privateKey PEM-encoded private key for the service account.
 */
interface ServiceAccountKey {
  projectID: string;
  clientEmail: string;
  privateKeyID: string;
  privateKey: string;
}

/**
 * CredentialsJSONClient is a client that accepts a service account key JSON
 * credential.
 */
export class CredentialsJSONClient implements AuthClient {
  readonly #projectID: string;
  readonly #credentials: ServiceAccountKey;

  constructor(opts: CredentialsJSONClientOptions) {
    this.#credentials = this.parseServiceAccountKeyJSON(opts.credentialsJSON);
    this.#projectID = opts.projectID || this.#credentials.projectID;
  }

  /**
   * parseServiceAccountKeyJSON attempts to parse the given string as a service
   * account key JSON. It handles if the string is base64-encoded.
   */
  parseServiceAccountKeyJSON(str: string): ServiceAccountKey {
    str = trimmedString(str);
    if (!str) {
      throw new Error(`Missing service account key JSON (got empty value)`);
    }

    // If the string doesn't start with a JSON object character, it is probably
    // base64-encoded.
    if (!str.startsWith('{')) {
      str = fromBase64(str);
    }

    try {
      const creds = JSON.parse(str);

      const extractRequiredValue = (key: string): string => {
        const val = trimmedString(creds[key]);
        if (!val) {
          throw new Error(`Service account key JSON is missing required field "${key}"`);
        }
        return val;
      };

      const serviceAccountKey: ServiceAccountKey = {
        projectID: extractRequiredValue('project_id'),
        clientEmail: extractRequiredValue('client_email'),
        privateKeyID: extractRequiredValue('private_key_id'),
        privateKey: extractRequiredValue('private_key'),
      };
      return serviceAccountKey;
    } catch (e) {
      throw new SyntaxError(`Failed to parse credentials as JSON: ${e}`);
    }
  }

  /**
   * getAuthToken generates a token capable of calling the iamcredentials API.
   */
  async getAuthToken(): Promise<string> {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: this.#credentials.privateKeyID,
    };

    const now = Math.floor(new Date().getTime() / 1000);

    const body = {
      iss: this.#credentials.clientEmail,
      sub: this.#credentials.clientEmail,
      aud: 'https://iamcredentials.googleapis.com/',
      iat: now,
      exp: now + 3599,
    };

    const message = toBase64(JSON.stringify(header)) + '.' + toBase64(JSON.stringify(body));

    try {
      const signer = createSign('RSA-SHA256');
      signer.write(message);
      signer.end();

      const signature = signer.sign(this.#credentials.privateKey);
      return message + '.' + toBase64(signature);
    } catch (e) {
      throw new Error(`Failed to sign auth token: ${e}`);
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
    return this.#credentials.clientEmail;
  }

  /**
   * createCredentialsFile creates a Google Cloud credentials file that can be
   * set as GOOGLE_APPLICATION_CREDENTIALS for gcloud and client libraries.
   */
  async createCredentialsFile(outputDir: string): Promise<string> {
    return await writeSecureFile(outputDir, JSON.stringify(this.#credentials));
  }
}
