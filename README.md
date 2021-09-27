# auth

This GitHub Action exchanges a GitHub Actions OIDC token into a Google Cloud
access token using [Workload Identity Federation][wif]. This obviates the need
to export a long-lived Google Cloud service account key and establishes a trust
delegation relationship between a particular GitHub Actions workflow invocation
and permissions on Google Cloud.

#### Previously

1.  Create a Google Cloud service account and grant IAM permissions
1.  Export the long-lived JSON service account key
1.  Upload the JSON service account key to a GitHub secret

#### With Workload Identity Federation

1.  Create a Google Cloud service account and grant IAM permissions
1.  Create and configure a Workload Identity Provider for GitHub
1.  Exchange the GitHub Actions OIDC token for a short-lived Google Cloud access
    token


## Prerequisites

-   This action requires you to create and configure a Google Cloud Workload
    Identity Provider. See [#setup](#setup) for instructions.


## Usage

```yaml
jobs:
  job_id:
    # ...

    # Add "id-token" with the intended permissions.
    permissions:
      contents: read
      id-token: 'write'

    steps:
    - id: 'auth'
      name: 'Authenticate to Google Cloud'
      uses: 'google-github-actions/auth@v0.3.0'
      with:
        token_format: 'access_token'
        workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
        service_account: 'my-service-account@my-project.iam.gserviceaccount.com'

    # Example of using the token:
    - name: 'Access secret'
      run: |-
        curl https://secretmanager.googleapis.com/v1/projects/my-project/secrets/my-secret/versions/1:access \
          --header "Authorization: Bearer ${{ steps.auth.outputs.access_token }}"
```

Note that changing the `permissions` block may remove some default permissions.
See the [permissions documentation][github-perms] for more information.

See [Examples](#examples) for more examples.


## Inputs

-   `workload_identity_provider`: (Required) The full identifier of the Workload
    Identity Provider, including the project number, pool name, and provider
    name. This must be the full identifier which includes all parts, for
    example:

    ```text
    projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider
    ```

-   `service_account`: (Required) Email address or unique identifier of the
    Google Cloud service account for which to generate credentials. For example:

    ```text
    my-service-account@my-project.iam.gserviceaccount.com
    ```

-   `audience`: (Optional) The value for the audience (`aud`) parameter in the
    generated GitHub Actions OIDC token. At present, the only valid value is
    `"sigstore"`, but this variable exists in case custom values are permitted
    in the future. The default value is `"sigstore"`.

-   `create_credentials_file`: (Optional) If true, the action will securely
     generate a credentials file which can be used for authentication via gcloud
     and Google Cloud SDKs. The default is false.

-   `activate_credentials_file`: (Optional) If true and
    "create_credentials_file" is also true, this will set the
    `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path to the
    credentials file, which gcloud and Google Cloud SDKs automatically consume.
    The default value is true.

-   `token_format`: (Optional) Output format for the generated authentication
    token.

    -   For OAuth 2.0 access tokens, specify "access_token".
    -   For OIDC tokens, specify "id_token".
    -   To skip token generation, omit or set to the empty string "".

    The default value is "" (skip token creation).

-   `delegates`: (Optional) List of additional service account emails or unique
    identities to use for impersonation in the chain. By default there are no
    delegates.

-   `access_token_lifetime`: (Optional) Desired lifetime duration of the access
    token, in seconds. This must be specified as the number of seconds with a
    trailing "s" (e.g. 30s). The default value is 1 hour (3600s).

-   `access_token_scopes`: (Optional) List of OAuth 2.0 access scopes to be
    included in the generated token. This is only valid when "token_format" is
    "access_token". The default value is:

    ```text
    https://www.googleapis.com/auth/cloud-platform
    ```

-   `id_token_audience`: (Required\*) The audience for the generated ID Token.
    This option is required when "token_format" is "id_token", but otherwise can
    be omitted.

-   `id_token_include_email`: (Optional) Optional parameter of whether to
    include the service account email in the generated token. If true, the token
    will contain "email" and "email_verified" claims. This is only valid when
    "token_format" is "id_token". The default value is false.


## Outputs

-   `credentials_file_path`: Path on the local filesystem where the generated
    credentials file resides. This is only available if
    "create_credentials_file" was set to true.

-   `access_token`: The Google Cloud access token for calling other Google Cloud
    APIs. This is only available when "token_format" is "access_token".

-   `access_token_expiration`: The RFC3339 UTC "Zulu" format timestamp for the
    access token. This is only available when "token_format" is "access_token".

-   `id_token`: The Google Cloud ID token. This is only available when
    "token_format" is "id_token".

## Examples

#### Cloud SDK (gcloud)

This example demonstrates using this GitHub Action to configure authentication
for the `gcloud` CLI tool. Note this does **not** work for the `gsutil` tool.

```yaml
jobs:
  job_id:
    # ...

    # Add "id-token" with the intended permissions.
    permissions:
      contents: read
      id-token: 'write'

    steps:
    # Install gcloud, do not specify authentication.
    - uses: 'google-github-actions/setup-gcloud@master'
      with:
        project_id: 'my-project'

    # Configure Workload Identity Federation via a credentials file.
    - id: 'auth'
      name: 'Authenticate to Google Cloud'
      uses: 'google-github-actions/auth@v0.3.0'
      with:
        create_credentials_file: 'true'
        workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
        service_account: 'my-service-account@my-project.iam.gserviceaccount.com'

    # Authenticate using the created credentials file.
    #
    # WARNING: The --cred-file flag is in preview and is subject to change.
    - id: 'gcloud'
      name: 'gcloud'
      run: |-
        gcloud auth login --brief --cred-file="${{ steps.auth.outputs.credentials_file_path }}"

        # Now you can run gcloud commands authenticated as the impersonated service account.
        gcloud secrets versions access "latest" --secret "my-secret"
```

#### Access Token (OAuth 2.0)

This example demonstrates using this GitHub Action to generate an OAuth 2.0
Access Token for authenticating to Google Cloud. Most Google Cloud APIs accept
this access token as authentication.

The default lifetime is 1 hour, but you can request up to 12 hours if you set
the [`constraints/iam.allowServiceAccountCredentialLifetimeExtension` organization policy](https://cloud.google.com/resource-manager/docs/organization-policy/org-policy-constraints).

```yaml
jobs:
  job_id:
    # ...

    # Add "id-token" with the intended permissions.
    permissions:
      contents: read
      id-token: 'write'

    steps:
    # Configure Workload Identity Federation and generate an access token.
    - id: 'auth'
      name: 'Authenticate to Google Cloud'
      uses: 'google-github-actions/auth@v0.3.0'
      with:
        token_format: 'access_token'
        workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
        service_account: 'my-service-account@my-project.iam.gserviceaccount.com'
        access_token_lifetime: '300s' # optional, default: '3600s' (1 hour)

    # Example of using the output. The token is usually provided as a Bearer
    # token.
    - id: 'access-secret'
      run: |-
        curl https://secretmanager.googleapis.com/v1/projects/my-project/secrets/my-secret/versions/1:access \
          --header "Authorization: Bearer ${{ steps.auth.outputs.access_token }}"
```

#### ID Token (JWT)

This example demonstrates using this GitHub Action to generate a Google Cloud ID
Token for authenticating to Google Cloud. This is most commonly used when
invoking a Cloud Run service.

```yaml
jobs:
  job_id:
    # ...

    # Add "id-token" with the intended permissions.
    permissions:
      contents: read
      id-token: 'write'

    steps:
    # Configure Workload Identity Federation and generate an access token.
    - id: 'auth'
      name: 'Authenticate to Google Cloud'
      uses: 'google-github-actions/auth@v0.3.0'
      with:
        token_format: 'access_token'
        workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
        service_account: 'my-service-account@my-project.iam.gserviceaccount.com'
        id_token_audience: 'https://myapp-uvehjacqzq.a.run.app' # required, value depends on target
        id_token_include_email: true # optional

    # Example of using the output. The token is usually provided as a Bearer
    # token.
    - id: 'invoke-service'
      run: |-
        curl https://myapp-uvehjacqzq.a.run.app \
          --header "Authorization: Bearer ${{ steps.auth.outputs.id_token }}"
```


## Setup

To exchange a GitHub Actions OIDC token for a Google Cloud access token, you
must create and configure a Workload Identity Provider. These instructions use
the [gcloud][gcloud] command-line tool.

1.  Create or use an existing Google Cloud project. You must have privileges to
    create Workload Identity Pools, Workload Identity Providers, and to manage
    Service Accounts and IAM permissions. Save your project ID as an environment
    variable. The rest of these steps assume this environment variable is set:

    ```sh
    export PROJECT_ID="my-project" # update with your value
    ```

1.  (Optional) Create a Google Cloud Service Account. If you already have a
    Service Account, take note of the email address and skip this step.

    ```sh
    gcloud iam service-accounts create "my-service-account" \
      --project "${PROJECT_ID}"
    ```

1.  (Optional) Grant the Google Cloud Service Account permissions to access
    Google Cloud resources. This step varies by use case. For demonstration
    purposes, you could grant access to a Google Secret Manager secret or Google
    Cloud Storage object.

1.  Enable the IAM Credentials API:

    ```sh
    gcloud services enable iamcredentials.googleapis.com \
      --project "${PROJECT_ID}"
    ```

1.  Create a Workload Identity Pool:

    ```sh
    gcloud iam workload-identity-pools create "my-pool" \
      --project="${PROJECT_ID}" \
      --location="global" \
      --display-name="Demo pool"
    ```

1.  Get the full ID of the Workload Identity Pool:

    ```sh
    gcloud iam workload-identity-pools describe "my-pool" \
      --project="${PROJECT_ID}" \
      --location="global" \
      --format="value(name)"
    ```

    Save this value as an environment variable:

    ```sh
    export WORKLOAD_IDENTITY_POOL_ID="..." # value from above
    ```


1.  Create a Workload Identity Provider in that pool:

    ```sh
    gcloud iam workload-identity-pools providers create-oidc "my-provider" \
      --project="${PROJECT_ID}" \
      --location="global" \
      --workload-identity-pool="my-pool" \
      --display-name="Demo provider" \
      --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.aud=assertion.aud" \
      --issuer-uri="https://vstoken.actions.githubusercontent.com" \
      --allowed-audiences="sigstore"
    ```

    -   The audience of "sigstore" is currently the only value GitHub allows.
    -   The attribute mappings map claims in the GitHub Actions JWT to
        assertions you can make about the request (like the repository or GitHub
        username of the principal invoking the GitHub Action). These can be used
        to further restrict the authentication using `--attribute-condition`
        flags.

        For example, you can map the attribute repository values (which can be
        used later to restrict the authentication to specific repositories):

        ```sh
        --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository"
        ```

1.  Allow authentications from the Workload Identity Provider to impersonate the
    Service Account created above:

    **Warning**: This grants access to any resource in the pool (all GitHub
    repos). It's **strongly recommended** that you map to a specific attribute
    such as the actor or repository name instead. See [mapping external
    identities][map-external] for more information.

    ```sh
    gcloud iam service-accounts add-iam-policy-binding "my-service-account@${PROJECT_ID}.iam.gserviceaccount.com" \
      --project="${PROJECT_ID}" \
      --role="roles/iam.workloadIdentityUser" \
      --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_POOL_ID}/*"
    ```

    To map to a specific repository:

    ```sh
    gcloud iam service-accounts add-iam-policy-binding "my-service-account@${PROJECT_ID}.iam.gserviceaccount.com" \
      --role="roles/iam.workloadIdentityUser" \
      --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_POOL_ID}/attribute.repository/username/repo"
    ```

1.  Use this GitHub Action with the Workload Identity Provider ID and Service
    Account email. The GitHub Action will mint a GitHub OIDC token and exchange
    the GitHub token for a Google Cloud access token (assuming the authorization
    is correct). This all happens without exporting a Google Cloud service
    account key JSON!

    Note: It can take **up to 5 minutes** from when you configure the Workload
    Identity Pool mapping until the permissions are available.

## GitHub Token Format

Here is a sample GitHub Token for reference for attribute mappings:

```json
{
  "jti": "...",
  "sub": "repo:username/reponame:ref:refs/heads/master",
  "aud": "sigstore",
  "ref": "refs/heads/master",
  "sha": "d11880f4f451ee35192135525dc974c56a3c1b28",
  "repository": "username/reponame",
  "repository_owner": "reponame",
  "run_id": "1238222155",
  "run_number": "18",
  "run_attempt": "1",
  "actor": "username",
  "workflow": "OIDC",
  "head_ref": "",
  "base_ref": "",
  "event_name": "push",
  "ref_type": "branch",
  "job_workflow_ref": "username/reponame/.github/workflows/token.yml@refs/heads/master",
  "iss": "https://vstoken.actions.githubusercontent.com",
  "nbf": 1631718827,
  "exp": 1631719727,
  "iat": 1631719427
}
```

[wif]: https://cloud.google.com/iam/docs/workload-identity-federation
[gcloud]: https://cloud.google.com/sdk
[map-external]: https://cloud.google.com/iam/docs/access-resources-oidc#impersonate
[github-perms]: https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#permissions
