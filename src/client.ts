import https, { RequestOptions } from 'https';
import { URL } from 'url';

/**
 * GitHubTokenParameters are the parameters to generate an OIDC token from
 * within a GitHub Action.
 *
 * @param url URL endpoint from which to request the token.
 * @param audience JWT aud value for the token.
 * @param token Temporary token provided by the environment to request the real
 * token.
 */
interface GitHubTokenParameters {
  url: string;
  audience: string;
  token: string;
}

/**
 * GoogleFederatedTokenParameters are the parameters to generate a Federated
 * Identity Token as described in:
 *
 *   https://cloud.google.com/iam/docs/access-resources-oidc#exchange-token
 *
 * @param providerID Full path (including project, location, etc) to the Google
 * Cloud Workload Identity Provider.
 * @param token OIDC token to exchange for a Google Cloud federated token.
 */
interface GoogleFederatedTokenParameters {
  providerID: string;
  token: string;
}

/**
 * GoogleAccessTokenParameters are the parameters to generate a Google Cloud
 * access token as described in:
 *
 *   https://cloud.google.com/iam/docs/reference/credentials/rest/v1/projects.serviceAccounts/generateAccessToken
 *
 * @param token OAuth token or Federated access token with permissions to call
 * the API.
 * @param serviceAccount Email address or unique identifier of the service
 * account.
 * @param delegates Optional sequence of service accounts in the delegation
 * chain.
 * @param lifetime Optional validity period as a duration.
 */
interface GoogleAccessTokenParameters {
  token: string;
  serviceAccount: string;
  delegates?: Array<string>;
  lifetime?: string;
}

/**
 * GoogleAccessTokenResponse is the response from generating an access token.
 *
 * @param accessToken OAuth 2.0 access token.
 * @param expiration A timestamp in RFC3339 UTC "Zulu" format when the token
 * expires.
 */
interface GoogleAccessTokenResponse {
  accessToken: string;
  expiration: string;
}

/**
 * GoogleIDTokenParameters are the parameters to generate a Google Cloud
 * ID token as described in:
 *
 *   https://cloud.google.com/iam/docs/reference/credentials/rest/v1/projects.serviceAccounts/generateIdToken
 *
 * @param token OAuth token or Federated access token with permissions to call
 * the API.
 * @param serviceAccount Email address or unique identifier of the service
 * account.
 * @param audience The audience for the token.
 * @param delegates Optional sequence of service accounts in the delegation
 * chain.
 */
interface GoogleIDTokenParameters {
  token: string;
  serviceAccount: string;
  audience: string;
  delegates?: Array<string>;
}

/**
 * GoogleIDTokenResponse is the response from generating an ID token.
 *
 * @param token ID token.
 * expires.
 */
interface GoogleIDTokenResponse {
  token: string;
}

export class Client {
  /**
   * request is a high-level helper that returns a promise from the executed
   * request.
   */
  static request(opts: RequestOptions, data?: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = https.request(opts, (res) => {
        res.setEncoding('utf8');

        let body = '';
        res.on('data', (data) => {
          body += data;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(body);
          } else {
            resolve(body);
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (data != null) {
        req.write(data);
      }

      req.end();
    });
  }

  /**
   * githubToken invokes the given URL, appending the audience parameter, using
   * the provided token as authentication. This can only be run from inside a
   * GitHub Action.
   */
  static async githubToken({ url, audience, token }: GitHubTokenParameters): Promise<string> {
    const requestURL = new URL(url);

    // Append the audience value to the request.
    const params = requestURL.searchParams;
    params.set('audience', audience);
    requestURL.search = params.toString();

    // Make the request.
    const opts = {
      hostname: requestURL.hostname,
      port: requestURL.port,
      path: requestURL.pathname + requestURL.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    try {
      const resp = await Client.request(opts);
      const parsed = JSON.parse(resp);
      return parsed['value'];
    } catch (err) {
      throw new Error(`failed to generate GitHub OIDC token via ${url} (aud: ${audience}): ${err}`);
    }
  }

  /**
   * googleFederatedToken generates a Google Cloud federated token using the
   * provided OIDC token and Workload Identity Provider.
   */
  static async googleFederatedToken({
    providerID,
    token,
  }: GoogleFederatedTokenParameters): Promise<string> {
    const stsURL = new URL('https://sts.googleapis.com/v1/token');

    const data = {
      audience: '//iam.googleapis.com/' + providerID,
      grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
      requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      subjectTokenType: 'urn:ietf:params:oauth:token-type:jwt',
      subjectToken: token,
    };

    const opts = {
      hostname: stsURL.hostname,
      port: stsURL.port,
      path: stsURL.pathname + stsURL.search,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    try {
      const resp = await Client.request(opts, JSON.stringify(data));
      const parsed = JSON.parse(resp);
      return parsed['access_token'];
    } catch (err) {
      throw new Error(`failed to generate Google Cloud federated token for ${providerID}: ${err}`);
    }
  }

  /**
   * googleAccessToken generates a Google Cloud access token for the provided
   * service account email or unique id.
   */
  static async googleAccessToken({
    token,
    serviceAccount,
    delegates,
    lifetime,
  }: GoogleAccessTokenParameters): Promise<GoogleAccessTokenResponse> {
    const serviceAccountID = `projects/-/serviceAccounts/${serviceAccount}`;
    const tokenURL = new URL(
      `https://iamcredentials.googleapis.com/v1/${serviceAccountID}:generateAccessToken`,
    );

    const data = {
      delegates: delegates,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      lifetime: lifetime,
    };

    const opts = {
      hostname: tokenURL.hostname,
      port: tokenURL.port,
      path: tokenURL.pathname + tokenURL.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    try {
      const resp = await Client.request(opts, JSON.stringify(data));
      const parsed = JSON.parse(resp);
      return {
        accessToken: parsed['accessToken'],
        expiration: parsed['expireTime'],
      };
    } catch (err) {
      throw new Error(`failed to generate Google Cloud access token for ${serviceAccount}: ${err}`);
    }
  }

  /**
   * googleIDToken generates a Google Cloud ID token for the provided
   * service account email or unique id.
   */
  static async googleIDToken({
    token,
    serviceAccount,
    audience,
    delegates,
  }: GoogleIDTokenParameters): Promise<GoogleIDTokenResponse> {
    const serviceAccountID = `projects/-/serviceAccounts/${serviceAccount}`;
    const tokenURL = new URL(
      `https://iamcredentials.googleapis.com/v1/${serviceAccountID}:generateIdToken`,
    );

    const data = {
      delegates: delegates,
      audience: audience,
      includeEmail: true,
    };

    const opts = {
      hostname: tokenURL.hostname,
      port: tokenURL.port,
      path: tokenURL.pathname + tokenURL.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    try {
      const resp = await Client.request(opts, JSON.stringify(data));
      const parsed = JSON.parse(resp);
      return {
        token: parsed['token'],
      };
    } catch (err) {
      throw new Error(`failed to generate Google Cloud ID token for ${serviceAccount}: ${err}`);
    }
  }
}
