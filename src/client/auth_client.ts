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

/**
 * Client is the default HTTP client for interacting with the IAM credentials
 * API.
 */
export interface AuthClient {
  /**
   * getToken() gets or generates the best token for the auth client.
   */
  getToken(): Promise<string>;

  /**
   * createCredentialsFile creates a credential file (for use with gcloud and
   * other Google Cloud tools) that instructs the tool how to perform identity
   * federation.
   */
  createCredentialsFile(outputPath: string): Promise<string>;

  /**
   * signJWT signs a JWT using the auth provider.
   */
  signJWT(claims: any): Promise<string>;
}
