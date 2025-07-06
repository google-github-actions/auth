# Manual Push Instructions

Since there's a credential conflict, here's how to manually push the changes.

**IMPORTANT**: Make sure to use your personal account (bitsabhi) and NOT your office account (abhissrivasta_expedia)!

## Option 1: Using Terminal with Personal Access Token

1. Generate a personal access token for your `bitsabhi` account:
   - Go to https://github.com/settings/tokens
   - Generate new token (classic)
   - Give it `repo` scope
   
2. Push using the token:
   ```bash
   cd /Users/abhissrivasta/GolandProjects/auth
   git push https://bitsabhi:YOUR_TOKEN@github.com/bitsabhi/auth.git fix-id-token-refresh-issue-441
   ```

## Option 2: Clone in a New Location

1. Clone your fork in a different directory:
   ```bash
   cd /tmp
   git clone https://github.com/bitsabhi/auth.git auth-personal
   cd auth-personal
   ```

2. Create branch and apply the patch:
   ```bash
   git checkout -b fix-id-token-refresh-issue-441
   git apply /Users/abhissrivasta/GolandProjects/auth/fix-441.patch
   ```

3. Push:
   ```bash
   git push -u origin fix-id-token-refresh-issue-441
   ```

## Option 3: Using GitHub Web Interface

1. Go to your fork: https://github.com/bitsabhi/auth
2. Create a new branch called `fix-id-token-refresh-issue-441`
3. Edit the following files manually:

### File 1: README.md
Add after line 322 (after the `id_token` output description):

```markdown
## Python Usage Note

When using Workload Identity Federation with Python libraries (e.g., `google-auth`), you may encounter errors when trying to refresh credentials to get an ID token. This is because the Google Auth library requires scopes to be set when refreshing credentials for impersonation.

If you need an ID token in Python, you have two options:

1. **Use the `token_format` parameter** (recommended): Generate the ID token directly with this action and use it as an environment variable in your Python code.

2. **Add scopes before refreshing**: If using default credentials, add the required scopes before refreshing:

```python
from google.auth import default
from google.auth.transport.requests import Request

credentials, project = default()
credentials = credentials.with_scopes(
    ["https://www.googleapis.com/auth/cloud-platform"]
)
credentials.refresh(request=Request())
```

For more details and examples, see the [Troubleshooting guide](docs/TROUBLESHOOTING.md#cannot-refresh-credentials-to-retrieve-an-id-token) and [Examples](docs/EXAMPLES.md#using-default-credentials-with-scopes-in-python).
```

### File 2: docs/TROUBLESHOOTING.md
Add before line 233 (before "## Organizational Policy Constraints"):

```markdown
## Cannot refresh credentials to retrieve an ID token

If you get an error like:

```text
google.auth.exceptions.RefreshError: ('Unable to acquire impersonated credentials', '{"error": {"code": 400, "message": "Request contains an invalid argument.", "status": "INVALID_ARGUMENT"}}')
```

when trying to refresh credentials in Python code to get an ID token, this is usually because the credentials are missing required scopes. The Google Auth library requires scopes to be set when refreshing credentials for impersonation.

To fix this issue, add the required scopes before refreshing:

```python
from google.auth import default
from google.auth.transport.requests import Request

credentials, project = default()
# Add scopes before refreshing
credentials = credentials.with_scopes(
    ["https://www.googleapis.com/auth/cloud-platform"]
)
credentials.refresh(request=Request())
# Now you can access the ID token
print(credentials.id_token)
```

Alternatively, you can use the `token_format` parameter of this action to generate an ID token directly:

```yaml
- uses: 'google-github-actions/auth@v2'
  with:
    workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
    service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}
    token_format: 'id_token'
    id_token_audience: 'https://example.com'
```

This will export the ID token as an environment variable that you can use in your Python code.
```

### File 3: docs/EXAMPLES.md
Add after line 189 (after the curl example):

```markdown
    # Example of using ID token in Python code
    - id: 'python-example'
      run: |-
        python -c "
        import os
        import requests
        
        # ID token is available as environment variable
        id_token = os.environ.get('GOOGLE_ID_TOKEN', '${{ steps.auth.outputs.id_token }}')
        
        # Use the token to invoke a Cloud Run service
        response = requests.get(
            'https://myapp-uvehjacqzq.a.run.app',
            headers={'Authorization': f'Bearer {id_token}'}
        )
        print(response.text)
        "
```

### Using Default Credentials with Scopes in Python

When using Workload Identity Federation with Python libraries, you may need to add scopes before refreshing credentials:

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
        workload_identity_provider: 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
        service_account: 'my-service-account@my-project.iam.gserviceaccount.com'

    - id: 'python-auth'
      run: |-
        python -c "
        from google.auth import default
        from google.auth.transport.requests import Request
        
        # Get default credentials
        credentials, project = default()
        
        # Add scopes before refreshing for impersonation
        credentials = credentials.with_scopes(
            ['https://www.googleapis.com/auth/cloud-platform']
        )
        
        # Refresh to get the token
        credentials.refresh(request=Request())
        
        # Now you can use the credentials
        print(f'Access token: {credentials.token}')
        if hasattr(credentials, 'id_token'):
            print(f'ID token: {credentials.id_token}')
        "
```

## After Making Changes

Create a PR from: https://github.com/bitsabhi/auth/pull/new/fix-id-token-refresh-issue-441

With title: "docs: Add troubleshooting for Python ID token refresh error"

And description:
```
This addresses issue #441 where users encounter an error when trying to refresh credentials to retrieve an ID token in Python code. The error occurs because the Google Auth library requires scopes to be set when refreshing credentials for impersonation.

Changes:
- Added new troubleshooting section explaining the ID token refresh error
- Provided solution with code example showing how to add scopes before refreshing
- Added Python usage note in README.md with quick reference
- Enhanced examples with Python code demonstrating proper credential usage

Fixes #441
```