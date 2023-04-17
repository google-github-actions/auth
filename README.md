# auth

This GitHub Action authenticates to Google Cloud. It supports authentication via
a Google Cloud Service Account Key JSON and authentication via [Workload
Identity Federation][wif].

Workload Identity Federation is recommended over Service Account Keys as it
obviates the need to export a long-lived credential and establishes a trust
delegation relationship between a particular GitHub Actions workflow invocation
and permissions on Google Cloud.

#### With Service Account Key JSON

1.  Create a Google Cloud service account and grant IAM permissions
1.  Export the long-lived JSON service account key
1.  Upload the JSON service account key to a GitHub secret

#### With Workload Identity Federation

1.  Create a Google Cloud service account and grant IAM permissions
1.  Create and configure a Workload Identity Provider for GitHub
1.  Exchange the GitHub Actions OIDC token for a short-lived Google Cloud access
    token


## Prerequisites

-   For authenticating via Google Cloud Service Account Keys, you must create and
    export a Google Cloud Service Account Key in JSON format.

-   For authenticating via Workload Identity Federation, you must create and
    configure a Google Cloud Workload Identity Provider. See [setup](#setup)
    for instructions.

-   You must run the `actions/checkout@v3` step _before_ this action. Omitting
    the checkout step or putting it after `auth` will cause future steps to be
    unable to authenticate.

-   If you plan to create binaries, containers, pull requests, or other
    releases, add the following to your `.gitignore` to prevent accidentially
    committing credentials to your release artifact:

    ```text
    # Ignore generated credentials from google-github-actions/auth
    gha-creds-*.json
    ```

-   This action runs using Node 16. If you are using self-hosted GitHub Actions
    runners, you must use runner version [2.285.0](https://github.com/actions/virtual-environments)
    or newer.


## Usage

```yaml
jobs:
  job_id:
    # ...

    # Add "id-token" with the intended permissions.
    permissions:
      contents: 'read'
      id-token: 'write'

    steps:
    # actions/checkout MUST come before auth
    - uses: 'actions/checkout@v3'

    - id: 'auth'
      name: 'Authenticate to Google Cloud'
      uses: 'google-github-actions/auth@v1'
      with:
        workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
        service_account: 'my-service-account@my-project.iam.gserviceaccount.com'

    # ... further steps are automatically authenticated
```

Note that changing the `permissions` block may remove some default permissions.
See the [permissions documentation][github-perms] for more information.

See [Examples](#examples) for more examples. For help debugging common errors, see [Troubleshooting](docs/TROUBLESHOOTING.md)


## Inputs

### Authenticating via Workload Identity Federation

The following inputs are for _authenticating_ to Google Cloud via Workload
Identity Federation.

**⚠️ You must use the Cloud SDK version 390.0.0 or later to authenticate the
`bq` and `gsutil` tools.**

**⚠️ Firebase users:** If you're using this Action to authenticate the Firebase
Admin Node.js SDK, you must authenticate with a service account key since
Workload Identity Federation is not yet supported. See
[#1377](https://github.com/firebase/firebase-admin-node/issues/1377)
for the status of WLIF support.

-   `workload_identity_provider`: (Required) The full identifier of the Workload Identity
    Provider, including the project number, pool name, and provider name. If
    provided, this must be the full identifier which includes all parts:

    ```text
    projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider
    ```

-   `service_account`: (Required) Email address or unique identifier of the Google Cloud
    service account for which to generate credentials. For example:

    ```text
    my-service-account@my-project.iam.gserviceaccount.com
    ```

-   `audience`: (Optional) The value for the audience (`aud`) parameter in the
    generated GitHub Actions OIDC token. This value defaults to the value of
    `workload_identity_provider`, which is also the default value Google Cloud
    expects for the audience parameter on the token. We do not recommend
    changing this value.

### Authenticating via Service Account Key JSON

The following inputs are for _authenticating_ to Google Cloud via a Service
Account Key JSON. **We recommend using Workload Identity Federation instead as
exporting a long-lived Service Account Key JSON credential poses a security
risk.**

-   `credentials_json`: (Required) The Google Cloud JSON service account key to
    use for authentication. To generate access tokens or ID tokens using this
    service account, you must grant the underlying service account
    `roles/iam.serviceAccountTokenCreator` permissions on itself.

    Note: we strongly advise that you "compress" your JSON into a single line
    string before storing it in a GitHub Secret. When a GitHub Secret is used in
    a GitHub Actions workflow, _each line_ of the secret is masked in log
    output. This can lead to aggressive sanitization of benign characters like
    curly braces (`{}`) and brackets (`[]`). See
    [Troubleshooting](docs/TROUBLESHOOTING.md#aggressive-replacement) for more
    information.

### Generating OAuth 2.0 access tokens

The following inputs are for _generating_ OAuth 2.0 access tokens for
authenticating to Google Cloud as an output for use in future steps in the
workflow. These options only apply to access tokens generated by this action. By
default, this action does not generate any tokens.

-   `token_format`: This value must be `"access_token"` to generate OAuth 2.0
    access tokens. To skip token generation, omit or set to the empty string "".

-   `access_token_lifetime`: (Optional) Desired lifetime duration of the access
    token, in seconds. This must be specified as the number of seconds with a
    trailing "s" (e.g. 30s). The default value is 1 hour (3600s). The maximum
    value is 1 hour, unless the
    [`constraints/iam.allowServiceAccountCredentialLifetimeExtension`
    organization policy][orgpolicy-creds-lifetime] is enabled, in which case the
    maximum value is 12 hours.

-   `access_token_scopes`: (Optional) List of OAuth 2.0 access scopes to be
    included in the generated token. This is only valid when "token_format" is
    "access_token". The default value is:

    ```text
    https://www.googleapis.com/auth/cloud-platform
    ```

-   `access_token_subject`: (Optional) Email address of a user to impersonate
    for [Domain-Wide Delegation][dwd]. Access tokens created for Domain-Wide
    Delegation cannot have a lifetime beyond 1 hour, even if the
    [`constraints/iam.allowServiceAccountCredentialLifetimeExtension`
    organization policy][orgpolicy-creds-lifetime] is enabled.

    In order to support Domain-Wide Delegation via Workload Identity Federation,
    you must grant the external identity ("principalSet")
    `roles/iam.serviceAccountTokenCreator` in addition to
    `roles/iam.workloadIdentityUser`. The default Workload Identity setup will
    only grant the latter role. If you want to use this GitHub Action with
    Domain-Wide Delegation, you must manually add the "Service Account Token
    Creator" role onto the external identity.

    You will also need to customize the `access_token_scopes` value to
    correspond to the OAuth scopes required for the API(s) you will access.

### Generating ID tokens

The following inputs are for _generating_ ID tokens for authenticating to Google
Cloud as an output for use in future steps in the workflow. These options only
apply to ID tokens generated by this action. By default, this action does not
generate any tokens.

-   `token_format`: This value must be `"id_token"` to generate ID tokens. To
    skip token generation, omit or set to the empty string "".

-   `id_token_audience`: (Required) The audience for the generated ID Token.

-   `id_token_include_email`: (Optional) Optional parameter of whether to
    include the service account email in the generated token. If true, the token
    will contain "email" and "email_verified" claims. This is only valid when
    "token_format" is "id_token". The default value is false.

### Retry inputs

-   `retries`: (Optional) Number of times to retry a failed authentication
    attempt. This is useful for automated pipelines that may execute before IAM
    permissions are fully propogated or intermittent connectivity failures. The
    default value is "3".

-   `backoff`: (Optional) Delay time before trying another authentication
    attempt. This is implemented using a fibonacci backoff method (e.g.
    1-1-2-3-5). This value defaults to 250 milliseconds.

-   `backoff_limit`: (Optional) Limits the retry backoff to the specified value.
    The default value is no limit.

### Other inputs

The following inputs are for controlling the behavior of this GitHub Actions,
regardless of the authentication mechanism.

-   `project_id`: (Optional) Custom project ID to use for authentication and
    exporting into other steps. If unspecified, the project ID will be extracted
    from the Workload Identity Provider or the Service Account Key JSON.

-   `create_credentials_file`: (Optional) If true, the action will securely
     generate a credentials file which can be used for authentication via gcloud
     and Google Cloud SDKs in other steps in the workflow. The default is true.

     The credentials file is exported into `$GITHUB_WORKSPACE`, which makes it
     available to all future steps and filesystems (including Docker-based
     GitHub Actions). The file is automatically removed at the end of the job
     via a post action. In order to use exported credentials, you **must** add
     the `actions/checkout` step before calling `auth`. This is due to how
     GitHub Actions creates `$GITHUB_WORKSPACE`:

     ```yaml
     jobs:
      job_id:
        steps:
        - uses: 'actions/checkout@v3' # Must come first!
        - uses: 'google-github-actions/auth@v1'
     ```

-   `export_environment_variables`: (Optional) If true, the action will export
    common environment variables which are known to be consumed by popular
    downstream libraries and tools, including:

    -   `CLOUDSDK_PROJECT`
    -   `CLOUDSDK_CORE_PROJECT`
    -   `GCP_PROJECT`
    -   `GCLOUD_PROJECT`
    -   `GOOGLE_CLOUD_PROJECT`

    If "create_credentials_file" is true, additional environment variables are
    exported:

    -   `CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE`
    -   `GOOGLE_APPLICATION_CREDENTIALS`
    -   `GOOGLE_GHA_CREDS_PATH`

    If false, the action will not export any environment variables, meaning
    future steps are unlikely to be automatically authenticated to Google Cloud.
    The default value is true.

-   `delegates`: (Optional) List of additional service account emails or unique
    identities to use for impersonation in the chain. By default there are no
    delegates.

-   `cleanup_credentials`: (Optional) If true, the action will remove any
    created credentials from the filesystem upon completion. This only applies
    if "create_credentials_file" is true. The default is true.

## Outputs

-   `project_id`: Provided or extracted value for the Google Cloud project ID.

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

### Authenticating via Workload Identity Federation

This example demonstrates authenticating via Workload Identity Federation. For
more information on how to setup and configure Workload Identity Federation, see
[#setup](#setup).

```yaml
jobs:
  job_id:
    # ...

    # Add "id-token" with the intended permissions.
    permissions:
      contents: 'read'
      id-token: 'write'

    steps:
    - uses: 'actions/checkout@v3'

    - id: 'auth'
      name: 'Authenticate to Google Cloud'
      uses: 'google-github-actions/auth@v1'
      with:
        workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
        service_account: 'my-service-account@my-project.iam.gserviceaccount.com'
```

### Authenticating via Service Account Key JSON

This example demonstrates authenticating via a Google Cloud Service Account Key
JSON. **We recommend using Workload Identity Federation instead as exporting a
long-lived Service Account Key JSON credential poses a security risk.**

This example assumes you have created a GitHub Secret named 'GOOGLE_CREDENTIALS'
with the contents being an export Google Cloud Service Account Key JSON. See
[Creating and managing Google Cloud Service Account
Keys](https://cloud.google.com/iam/docs/creating-managing-service-account-keys)
for more information.

```yaml
jobs:
  job_id:
    # ...

    steps:
    - uses: 'actions/checkout@v3'

    - id: 'auth'
      name: 'Authenticate to Google Cloud'
      uses: 'google-github-actions/auth@v1'
      with:
        credentials_json: '${{ secrets.GOOGLE_CREDENTIALS }}'
```

### Authenticating to Container Registry and Artifact Registry

This example demonstrates authenticating to Google Container Registry (GCR) or
Google Artifact Registry (GAR). The most common way to authenticate to these
services is via a gcloud docker proxy. However, you can authenticate to these
registries directly using the `auth` action:

-   **Username:** `oauth2accesstoken`
-   **Password:** `${{ steps.auth.outputs.access_token }}`

You must set `token_format: access_token` in your Action YAML. Here are a few
examples:

```yaml
jobs:
  job_id:
    steps:
    - uses: 'actions/checkout@v3'

    - id: 'auth'
      name: 'Authenticate to Google Cloud'
      uses: 'google-github-actions/auth@v1'
      with:
        token_format: 'access_token'
        # Either user Workload Identity Federation or Service Account Keys. See
        # above more more examples

    # This example uses the docker login action
    - uses: 'docker/login-action@v1'
      with:
        registry: 'gcr.io' # or REGION-docker.pkg.dev
        username: 'oauth2accesstoken'
        password: '${{ steps.auth.outputs.access_token }}'

    # This example runs "docker login" directly to Artifact Registry.
    - run: |-
        echo '${{ steps.auth.outputs.access_token }}' | docker login -u oauth2accesstoken --password-stdin https://REGION-docker.pkg.dev

    # This example runs "docker login" directly to Container Registry.
    - run: |-
        echo '${{ steps.auth.outputs.access_token }}' | docker login -u oauth2accesstoken --password-stdin https://gcr.io
```

### Configuring gcloud

This example demonstrates using this GitHub Action to configure authentication
for the `gcloud` CLI tool.

**Warning!** Workload Identity Federation requires Cloud SDK (`gcloud`) version
[363.0.0](https://cloud.google.com/sdk/docs/release-notes#36300_2021-11-02) or
later.

```yaml
jobs:
  job_id:
    # ...

    # Add "id-token" with the intended permissions.
    permissions:
      contents: 'read'
      id-token: 'write'

    steps:
    - uses: 'actions/checkout@v3'

    # Configure Workload Identity Federation via a credentials file.
    - id: 'auth'
      name: 'Authenticate to Google Cloud'
      uses: 'google-github-actions/auth@v1'
      with:
        workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
        service_account: 'my-service-account@my-project.iam.gserviceaccount.com'

    # Install gcloud, `setup-gcloud` automatically picks up authentication from `auth`.
    - name: 'Set up Cloud SDK'
      uses: 'google-github-actions/setup-gcloud@v1'

    # Now you can run gcloud commands authenticated as the impersonated service account.
    - id: 'gcloud'
      name: 'gcloud'
      run: |-
        gcloud secrets versions access "latest" --secret "my-secret"
```

### Generating an OAuth 2.0 Access Token

This example demonstrates using this GitHub Action to generate an OAuth 2.0
Access Token for authenticating to Google Cloud. Most Google Cloud APIs accept
this access token as authentication.

The default lifetime is 1 hour, but you can request up to 12 hours if you set
the [`constraints/iam.allowServiceAccountCredentialLifetimeExtension` organization policy][orgpolicy-creds-lifetime].

Note: If you authenticate via `credentials_json`, the service account must have
`roles/iam.serviceAccountTokenCreator` on itself.

```yaml
jobs:
  job_id:
    # ...

    # Add "id-token" with the intended permissions.
    permissions:
      contents: 'read'
      id-token: 'write'

    steps:
    - uses: 'actions/checkout@v3'

    # Configure Workload Identity Federation and generate an access token.
    - id: 'auth'
      name: 'Authenticate to Google Cloud'
      uses: 'google-github-actions/auth@v1'
      with:
        token_format: 'access_token' # <--
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

### Generating an ID Token (JWT)

This example demonstrates using this GitHub Action to generate a Google Cloud ID
Token for authenticating to Google Cloud. This is most commonly used when
invoking a Cloud Run service.

Note: If you authenticate via `credentials_json`, the service account must have
`roles/iam.serviceAccountTokenCreator` on itself.

```yaml
jobs:
  job_id:
    # ...

    # Add "id-token" with the intended permissions.
    permissions:
      contents: 'read'
      id-token: 'write'

    steps:
    - uses: 'actions/checkout@v3'

    # Configure Workload Identity Federation and generate an access token.
    - id: 'auth'
      name: 'Authenticate to Google Cloud'
      uses: 'google-github-actions/auth@v1'
      with:
        token_format: 'id_token' # <--
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


<a id="setup"></a>

## Setting up Workload Identity Federation

To exchange a GitHub Actions OIDC token for a Google Cloud access token, you
must create and configure a Workload Identity Provider. These instructions use
the [gcloud][gcloud] command-line tool.

Alternatively, you can also use the [gh-oidc](https://github.com/terraform-google-modules/terraform-google-github-actions-runners/tree/master/modules/gh-oidc)
Terraform module to automate your infrastructure provisioning. See [examples](https://github.com/terraform-google-modules/terraform-google-github-actions-runners/tree/master/examples/oidc-simple) for usage.

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

1.  Get the full ID of the Workload Identity **Pool**:

    ```sh
    gcloud iam workload-identity-pools describe "my-pool" \
      --project="${PROJECT_ID}" \
      --location="global" \
      --format="value(name)"
    ```

    Save this value as an environment variable:

    ```sh
    export WORKLOAD_IDENTITY_POOL_ID="..." # value from above

    # This should look like:
    #
    #   projects/123456789/locations/global/workloadIdentityPools/my-pool
    #
    ```


1.  Create a Workload Identity **Provider** in that pool:

    ```sh
    gcloud iam workload-identity-pools providers create-oidc "my-provider" \
      --project="${PROJECT_ID}" \
      --location="global" \
      --workload-identity-pool="my-pool" \
      --display-name="Demo provider" \
      --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
      --issuer-uri="https://token.actions.githubusercontent.com"
    ```

    The attribute mappings map claims in the GitHub Actions JWT to assertions
    you can make about the request (like the repository or GitHub username of
    the principal invoking the GitHub Action). These can be used to further
    restrict the authentication using `--attribute-condition` flags.

    The example above only maps the `actor` and `repository` values. To map
    additional values, add them to the attribute map:

    ```sh
    --attribute-mapping="google.subject=assertion.sub,attribute.repository_owner=assertion.repository_owner"
    ```

    **You must map any claims in the incoming token to attributes before you can
    assert on those attributes in a CEL expression or IAM policy!**

1.  Allow authentications from the Workload Identity Provider originating from
    your repository to impersonate the Service Account created above:

    ```sh
    # TODO(developer): Update this value to your GitHub repository.
    export REPO="username/name" # e.g. "google/chrome"

    gcloud iam service-accounts add-iam-policy-binding "my-service-account@${PROJECT_ID}.iam.gserviceaccount.com" \
      --project="${PROJECT_ID}" \
      --role="roles/iam.workloadIdentityUser" \
      --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_POOL_ID}/attribute.repository/${REPO}"
    ```

    If you want to admit all repos of an owner (user or organization), map on `attribute.repository_owner`:

    ```sh
    --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_POOL_ID}/attribute.repository_owner/${OWNER}"
    ```

    For this to work, you need to make sure that `attribute.repository_owner` is mapped in your attribute mapping (see previous step).

    Note that `$WORKLOAD_IDENTITY_POOL_ID` should be the **full** Workload
    Identity Pool resource ID, like:

    ```text
    projects/123456789/locations/global/workloadIdentityPools/my-pool
    ```

1.  Extract the Workload Identity **Provider** resource name:

    ```sh
    gcloud iam workload-identity-pools providers describe "my-provider" \
      --project="${PROJECT_ID}" \
      --location="global" \
      --workload-identity-pool="my-pool" \
      --format="value(name)"
    ```

    Use this value as the `workload_identity_provider` value in your GitHub
    Actions YAML.

1.  Use this GitHub Action with the Workload Identity Provider ID and Service
    Account email. The GitHub Action will mint a GitHub OIDC token and exchange
    the GitHub token for a Google Cloud access token (assuming the authorization
    is correct). This all happens without exporting a Google Cloud service
    account key JSON!

    Note: It can take **up to 5 minutes** from when you configure the Workload
    Identity Pool mapping until the permissions are available.


#### Organizational Policy Constraints

By default, Google Cloud allows you to create Workload Identity Pools and
Workload Identity Providers for any endpoints. Your organization may restrict
which external identity providers are permitted on your Google Cloud account. To
enable GitHub Actions as a Workload Identity Pool and Provider, add the
`https://token.actions.githubusercontent.com` to the allowed
`iam.workloadIdentityPoolProviders` Org Policy constraint.

```shell
gcloud resource-manager org-policies allow "constraints/iam.workloadIdentityPoolProviders" \
  https://token.actions.githubusercontent.com
```

You can specify a `--folder` or `--organization`. If you do not have permission
to manage these Org Policies, please contact your Google Cloud administrator.

For GitHub Enterprise Server, the endpoint will be your server URL:

```shell
gcloud resource-manager org-policies allow "constraints/iam.workloadIdentityPoolProviders" \
  https://my.github.company
```


## GitHub Token Format

Below is a sample GitHub Token for reference for attribute mappings. For a list of all
mappings, see the [GitHub OIDC token documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#understanding-the-oidc-token).

```json
{
  "jti": "...",
  "sub": "repo:username/reponame:ref:refs/heads/main",
  "aud": "https://iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider",
  "ref": "refs/heads/main",
  "sha": "d11880f4f451ee35192135525dc974c56a3c1b28",
  "repository": "username/reponame",
  "repository_owner": "username",
  "repository_visibility": "private",
  "repository_id": "74",
  "repository_owner_id": "65",
  "run_id": "1238222155",
  "run_number": "18",
  "run_attempt": "1",
  "actor": "username",
  "actor_id": "12",
  "workflow": "oidc",
  "head_ref": "",
  "base_ref": "",
  "event_name": "push",
  "ref_type": "branch",
  "job_workflow_ref": "username/reponame/.github/workflows/token.yml@refs/heads/main",
  "iss": "https://token.actions.githubusercontent.com",
  "nbf": 1631718827,
  "exp": 1631719727,
  "iat": 1631719427
}
```


## Versioning

We recommend pinning to the latest available major version:

```yaml
- uses: 'google-github-actions/auth@v1'
```

While this action attempts to follow semantic versioning, but we're ultimately
human and sometimes make mistakes. To prevent accidental breaking changes, you
can also pin to a specific version:

```yaml
- uses: 'google-github-actions/auth@v1.0.0'
```

However, you will not get automatic security updates or new features without
explicitly updating your version number. Note that we only publish `MAJOR` and
`MAJOR.MINOR.PATCH` versions. There is **not** a floating alias for
`MAJOR.MINOR`.


[wif]: https://cloud.google.com/iam/docs/workload-identity-federation
[gcloud]: https://cloud.google.com/sdk
[map-external]: https://cloud.google.com/iam/docs/access-resources-oidc#impersonate
[github-perms]: https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#permissions
[dwd]: https://developers.google.com/admin-sdk/directory/v1/guides/delegation
[orgpolicy-creds-lifetime]: https://cloud.google.com/resource-manager/docs/organization-policy/org-policy-constraints
