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

import { createSign } from 'crypto';

import {
  errorMessage,
  isServiceAccountKey,
  parseCredential,
  ServiceAccountKey,
  toBase64,
  writeSecureFile,
} from '@google-github-actions/actions-utils';

import { AuthClient, Client, ClientParameters } from './client';

/**
 * ServiceAccountKeyClientParameters is used as input to the
 * ServiceAccountKeyClient.
 */
export interface ServiceAccountKeyClientParameters extends ClientParameters {
  readonly serviceAccountKey: string;
}

/**
 * ServiceAccountKeyClient is an authentication client that expects a Service
 * Account Key JSON file.
 */
export class ServiceAccountKeyClient extends Client implements AuthClient {
  readonly #serviceAccountKey: ServiceAccountKey;
  readonly #audience: string;

  constructor(opts: ServiceAccountKeyClientParameters) {
    super('ServiceAccountKeyClient', opts);

    const serviceAccountKey = parseCredential(opts.serviceAccountKey);
    if (!isServiceAccountKey(serviceAccountKey)) {
      throw new Error(`Provided credential is not a valid Google Service Account Key JSON`);
    }
    this.#serviceAccountKey = serviceAccountKey;
    this._logger.debug(`Parsed service account key`, serviceAccountKey.client_email);

    this.#audience = new URL(this._endpoints.iamcredentials).origin + `/`;
    this._logger.debug(`Computed audience`, this.#audience);
  }

  /**
   * getToken generates a self-signed JWT that, by default, is capable of
   * calling the iamcredentials API to mint OAuth 2.0 Access Tokens and ID
   * Tokens. However, users can theoretically override the audience value and
   * use the JWT to call other endpoints without calling iamcredentials.
   */
  async getToken(): Promise<string> {
    const logger = this._logger.withNamespace('getToken');

    const now = Math.floor(new Date().getTime() / 1000);

    const claims = {
      iss: this.#serviceAccountKey.client_email,
      sub: this.#serviceAccountKey.client_email,
      aud: this.#audience,
      iat: now,
      exp: now + 3599,
    };

    logger.debug(`Built jwt`, {
      claims: claims,
    });

    try {
      return await this.signJWT(claims);
    } catch (err) {
      const msg = errorMessage(err);
      throw new Error(
        `Failed to sign auth token using ${this.#serviceAccountKey.client_email}: ${msg}`,
      );
    }
  }

  /**
   * signJWT signs a JWT using the Service Account's private key.
   */
  async signJWT(claims: any): Promise<string> {
    const logger = this._logger.withNamespace('signJWT');

    const header = {
      alg: `RS256`,
      typ: `JWT`,
      kid: this.#serviceAccountKey.private_key_id,
    };

    const message = toBase64(JSON.stringify(header)) + `.` + toBase64(JSON.stringify(claims));

    logger.debug(`Built jwt`, {
      header: header,
      claims: claims,
      message: message,
    });

    try {
      const signer = createSign(`RSA-SHA256`);
      signer.write(message);
      signer.end();

      const signature = signer.sign(this.#serviceAccountKey.private_key);
      return message + '.' + toBase64(signature);
    } catch (err) {
      const msg = errorMessage(err);
      throw new Error(
        `Failed to sign jwt using private key for ${this.#serviceAccountKey.client_email}: ${msg}`,
      );
    }
  }

  /**
   * createCredentialsFile writes the Service Account Key JSON back to disk at
   * the specified outputPath.
   */
  async createCredentialsFile(outputPath: string): Promise<string> {
    const logger = this._logger.withNamespace('createCredentialsFile');

    logger.debug(`Creating credentials`, {
      outputPath: outputPath,
    });

    return await writeSecureFile(outputPath, JSON.stringify(this.#serviceAccountKey));
  }
}
