# Examples for Authenticating to Google Cloud from GitHub Actions

> Consider using the [Markdown TOC][github-markdown-toc] to make browsing these
> samples easier.

These examples assume you have completed all corresponding [Setup
Instructions](../README.md#setup).

## Direct Workload Identity Federation

This example shows authenticating directly with Workload Identity Federation.
Google Cloud Resources must have the Workload Identity Pool as a `principalSet`
as an IAM permission.

```yaml
jobs:
  job_id:
    permissions:
      contents: 'read'
      id-token: 'write'

    - id: 'auth'
      uses: 'google-github-actions/auth@v2'
      with:
        project_id: 'my-project'
        workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'

    # Use 'steps.auth.outputs.auth_token' in subsequent steps as a bearer token.
    #
    # - run: |-
    #   curl -H 'Bearer: ${{ steps.auth.outputs.auth_token }}' https://...
    #
```

## Workload Identity Federation through a Service Account

This example shows authenticating to Google Cloud by proxying through a Service
Account. Future authentication calls will be made with the Service Account's
OAuth 2.0 Access token.

```yaml
jobs:
  job_id:
    permissions:
      contents: 'read'
      id-token: 'write'

    - uses: 'google-github-actions/auth@v2'
      with:
        project_id: 'my-project'
        workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
        service_account: 'my-service-account@my-project.iam.gserviceaccount.com'

    # NOTE: 'steps.auth.outputs.auth_token' will be a federated authentication
    # token, it does not correspond to the service account. To get a token for
    # the service account, specify the 'token_format' parameter and use the
    # 'accesss_token' output.
    #
    # - uses: 'google-github-actions/auth@v2'
    #   with:
    #     workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
    #     service_account: 'my-service-account@my-project.iam.gserviceaccount.com'
    #     token_format: 'access_token'
    #
    # - run: |-
    #   curl -H 'Bearer: ${{ steps.auth.outputs.access_token }}' https://...
    #
```

## Service Account Key JSON

This example demonstrates authenticating via a Google Cloud Service Account Key
JSON. After you [export a Google Cloud Service Account Key][sake], insert the
value into a GitHub Secret named 'GOOGLE_CREDENTIALS'.

```yaml
jobs:
  job_id:
    steps:
    - uses: 'actions/checkout@v4'

    - uses: 'google-github-actions/auth@v2'
      with:
        credentials_json: '${{ secrets.GOOGLE_CREDENTIALS }}'
```

### Configuring gcloud

This example demonstrates using this GitHub Action to configure authentication
for the `gcloud` CLI tool.

```yaml
jobs:
  job_id:
    permissions:
      contents: 'read'
      id-token: 'write'

    steps:
    - uses: 'actions/checkout@v4'

    - id: 'auth'
      uses: 'google-github-actions/auth@v2'
      with:
        project_id: 'my-project'
        workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'

    - name: 'Set up Cloud SDK'
      uses: 'google-github-actions/setup-gcloud@v2'
```

### Generating an OAuth 2.0 Access Token

This example demonstrates using this GitHub Action to generate an OAuth 2.0
Access Token for authenticating to Google Cloud.

> [!NOTE]
>
> The default lifetime is 1 hour, but you can request up to 12 hours if you set
> the [`constraints/iam.allowServiceAccountCredentialLifetimeExtension`
> organization policy][orgpolicy-creds-lifetime].

> [!IMPORTANT]
>
> If you authenticate via `credentials_json`, the service account must have
> `roles/iam.serviceAccountTokenCreator` on itself.

```yaml
jobs:
  job_id:
    permissions:
      contents: 'read'
      id-token: 'write'

    steps:
    - uses: 'actions/checkout@v4'

    - id: 'auth'
      uses: 'google-github-actions/auth@v2'
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
Token for authenticating to Google Cloud. This is commonly used when invoking a
Cloud Run service.

> [!IMPORTANT]
>
> If you authenticate via `credentials_json`, the service account must have
> `roles/iam.serviceAccountTokenCreator` on itself.

```yaml
jobs:
  job_id:
    permissions:
      contents: 'read'
      id-token: 'write'

    steps:
    - uses: 'actions/checkout@v4'

    - id: 'auth'
      uses: 'google-github-actions/auth@v2'
      with:
        token_format: 'id_token' # <--
        workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
        service_account: 'my-service-account@my-project.iam.gserviceaccount.com'
        id_token_audience: 'https://myapp-uvehjacqzq.a.run.app' # required, value depends on target
        id_token_include_email: true

    # Example of using the output. The token is usually provided as a Bearer
    # token.
    - id: 'invoke-service'
      run: |-
        curl https://myapp-uvehjacqzq.a.run.app \
          --header "Authorization: Bearer ${{ steps.auth.outputs.id_token }}"
```

[github-markdown-toc]: https://github.blog/changelog/2021-04-13-table-of-contents-support-in-markdown-files/
[orgpolicy-creds-lifetime]: https://cloud.google.com/resource-manager/docs/organization-policy/org-policy-constraints
[sake]: https://cloud.google.com/iam/docs/creating-managing-service-account-keys
