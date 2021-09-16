# oidc-auth-google-cloud

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
    Identity Provider. See [#setup] for instructions.

## Usage

```yaml
jobs:
  run:
    # ...

    # Add "id-token" with the intended permissions.
    permissions:
      id-token: write
      contents: read

    steps:
    - id: 'google-cloud-auth'
      name: 'Authenticate to Google Cloud'
      uses: 'github.com/sethvargo/oidc-auth-google-cloud'
      with:
        workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
        service_account: 'my-service-account@my-project.iam.gserviceaccount.com'

    # Example of using the output:
    - id: 'access-secret'
      run: |-
        curl https://secretmanager.googleapis.com/v1/projects/my-project/secrets/my-secret/versions/1:access \
          --header "Authorization: Bearer ${{ steps.integration.outputs.access_token }}"
```

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

-   `delegates`: (Optional) List of additional service account emails or unique
    identities to use for impersonation in the chain. By default there are no
    delegates.

-   `lifetime`: (Optional) Desired lifetime duration of the access token, in
    seconds. This must be specified as the number of seconds with a trailing "s"
    (e.g. 30s). The default value is 1 hour (3600s).

-   `id_token_audience`: (Optional) The audience for the generated ID Token.

## Outputs

-   `access_token`: The authenticated Google Cloud access token for calling
    other Google Cloud APIs.

-   `expiration`: The RFC3339 UTC "Zulu" format timestamp when the token
    expires.

-   `id_token`: The authenticated Google Cloud ID token. This token is only
    generated when `id_token_audience` input parameter was provided.

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

1.  Create a Workload Identity Pool:

    ```sh
    gcloud iam workload-identity-pools create "my-pool" \
      --project="${PROJECT_ID}" \
      --location="global" \
      --display-name="Demo pool"
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

1.  Get the full ID for the Workload Identity Provider:

    ```sh
    gcloud iam workload-identity-pools providers describe "my-provider" \
      --project="${PROJECT_ID}" \
      --location="global" \
      --workload-identity-pool="my-pool"
    ```

    Take note of the `name` attribute. It will be of the format:

    ```text
    projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider
    ```

    Save this value as an environment variable:

    ```sh
    export WORKLOAD_IDENTITY_PROVIDER_ID="..." # value from above
    ```

1.  Allow authentications from the Workload Identity Provider to impersonate the
    Service Account created above:

    **Warning**: This grants access to any resource in the pool (all GitHub
    repos). It's **strongly recommended** that you map to a specific attribute
    such as the actor or repository name instead. See [mapping external
    identities][map-external] for more information.

    ```sh
    gcloud iam service-accounts add-iam-policy-binding "my-service-account@${PROJECT_ID}.iam.gserviceaccount.com" \
      --role="roles/iam.workloadIdentityUser" \
      --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_PROVIDER_ID}/*"
    ```

    To map to a specific repository:

    ```sh
    gcloud iam service-accounts add-iam-policy-binding "my-service-account@${PROJECT_ID}.iam.gserviceaccount.com" \
      --role="roles/iam.workloadIdentityUser" \
      --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_PROVIDER_ID}/attribute.repo/my-repo"
    ```

1.  Use this GitHub Action with the Workload Identity Provider ID and Service
    Account email. The GitHub Action will mint a GitHub OIDC token and exchange
    the GitHub token for a Google Cloud access token (assuming the authorization
    is correct). This all happens without exporting a Google Cloud service
    account key JSON!

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
