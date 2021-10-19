import { GoogleAuth } from 'google-auth-library';
import {
  ActionAuth,
  GoogleAccessTokenResponse,
  GoogleIDTokenResponse,
  GoogleAccessTokenParameters,
  GoogleIDTokenParameters,
  CreateCredentialsFileResponse,
} from './actionauth';
import { writeCredFile } from './utils';
import { BaseClient } from './base';

/**
 * Available options to create the key client.
 *
 * @param credentials GCP JSON credentials.
 */
export interface KeyClientOptions {
  credentials: string;
}

/**
 * Wraps interactions with the Google Auth lib
 * for generating tokens.
 *
 * @param opts KeyClientOptions.
 */

export class KeyClient implements ActionAuth {
  readonly saKey?: ServiceAccountKey;
  readonly defaultScope = 'https://www.googleapis.com/auth/cloud-platform';
  readonly auth: GoogleAuth;

  constructor(opts: KeyClientOptions) {
    this.saKey = parseServiceAccountKey(opts.credentials);
    this.auth = new GoogleAuth({
      scopes: this.defaultScope,
      credentials: this.saKey,
    });
  }

  /**
   * getAccessToken generates a Google Cloud access token for the provided
   * service account email. If no service account is specified, it defaults
   * to the service account specified in credentials JSON key or ADC.
   */
  async getAccessToken(opts: GoogleAccessTokenParameters): Promise<GoogleAccessTokenResponse> {
    // TODO(bharathkkb): Currently it seems like auth lib does not expose functionality to
    // modify lifetime for access token created from SA Key creds
    if (!(await this.shouldImpersonate(opts.serviceAccount)) && opts.lifetime) {
      throw new Error(
        'only default lifetime of 3600s is supported for generating access token from JSON key',
      );
    }
    if (!opts.scopes) {
      opts.scopes = [this.defaultScope];
    }
    const authClient = await this.auth.getClient();
    const accessToken = (await authClient.getAccessToken()).token;
    if (!accessToken) {
      throw new Error('failed to generate token.');
    }
    if (!authClient.credentials.expiry_date) {
      throw new Error('failed to get token expiry date.');
    }
    // if not impersonating, return access token
    if (!this.shouldImpersonate(opts.serviceAccount)) {
      return { accessToken, expiration: authClient.credentials.expiry_date.toString() };
    }
    // get access token for impersonated SA
    return await BaseClient.googleAccessToken(accessToken, opts);
  }

  /**
   * getIDToken generates a Google Cloud ID token for the provided
   * service account email. If no service account is specified, it defaults
   * to the service account specified in credentials JSON key or ADC.
   */
  async getIDToken({
    serviceAccount,
    audience,
    delegates,
    includeEmail,
  }: GoogleIDTokenParameters): Promise<GoogleIDTokenResponse> {
    if (!(await this.shouldImpersonate(serviceAccount))) {
      // GoogleAuth with empty scope as both scope and audience cannot be specified
      const auth = new GoogleAuth({ credentials: this.saKey });
      // TODO(bharathkkb): Currently it seems like auth lib does not expose functionality to
      // modify includeEmail for ID token created from SA Key creds
      const tokenClient = await auth.getIdTokenClient(audience);
      // refresh creds to generate id_token
      await tokenClient.getRequestHeaders();
      if (!tokenClient.credentials.id_token) {
        throw new Error('unable to generate id token');
      }
      return { token: tokenClient.credentials.id_token };
    }

    // if impersonated generate access token and request ID token for SA
    const authClient = await this.auth.getClient();
    const accessToken = await authClient.getAccessToken();
    if (!accessToken.token) {
      throw new Error('failed to generate access token for requesting impersonated ID token');
    }
    return await BaseClient.googleIDToken(accessToken.token, {
      serviceAccount,
      audience,
      delegates,
      includeEmail,
    });
  }

  /**
   * createCredentialsFile writes SA key to file and returns a map of env vars
   * containing GOOGLE_APPLICATION_CREDENTIALS and GCLOUD_PROJECT for gcloud and client libraries.
   */
  async createCredentialsFile(outputDir: string): Promise<CreateCredentialsFileResponse> {
    if (!this.saKey) {
      throw new Error('service account key is not set');
    }
    const credentialsPath = await writeCredFile(outputDir, JSON.stringify(this.saKey));
    const projectID = await this.auth.getProjectId();
    const envVars = new Map<string, string>([
      ['GOOGLE_APPLICATION_CREDENTIALS', credentialsPath],
      ['GCLOUD_PROJECT', projectID],
    ]);
    return { credentialsPath, envVars };
  }

  /**
   * Checks if client should perform impersonation.
   * Impersonation is performed IIF an explicit SA is specified and
   * it is different from the client SA.
   *
   * @param saEmail Optional service account email to impersonate.
   * @returns boolean
   */
  private async shouldImpersonate(saEmail?: string): Promise<boolean> {
    // client email from SA key or metadata server
    const { client_email } = await this.auth.getCredentials();
    if (saEmail && client_email && saEmail != client_email) {
      return true;
    }
    return false;
  }
}

interface ServiceAccountKey {
  type: string;
  project_id: string;
  project_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

/**
 * Parses the service account string into JSON.
 *
 * @param serviceAccountKey The service account key used for authentication.
 * @returns ServiceAccountKey as an object.
 */
export function parseServiceAccountKey(serviceAccountKey: string): ServiceAccountKey {
  let serviceAccount = serviceAccountKey;
  // Handle base64-encoded credentials
  if (!serviceAccountKey.trim().startsWith('{')) {
    serviceAccount = Buffer.from(serviceAccountKey, 'base64').toString('utf8');
  }
  return JSON.parse(serviceAccount);
}
