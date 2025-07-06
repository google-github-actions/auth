#!/bin/bash
cd /Users/abhissrivasta/GolandProjects/auth

# Use gh to push the branch
echo "Pushing branch to your fork..."
git push https://github.com/bitsabhi/auth.git fix-id-token-refresh-issue-441:fix-id-token-refresh-issue-441

echo "Creating PR..."
gh pr create \
  --repo google-github-actions/auth \
  --head bitsabhi:fix-id-token-refresh-issue-441 \
  --title "docs: Add troubleshooting for Python ID token refresh error" \
  --body "This addresses issue #441 where users encounter an error when trying to refresh credentials to retrieve an ID token in Python code. The error occurs because the Google Auth library requires scopes to be set when refreshing credentials for impersonation.

Changes:
- Added new troubleshooting section explaining the ID token refresh error
- Provided solution with code example showing how to add scopes before refreshing
- Added Python usage note in README.md with quick reference
- Enhanced examples with Python code demonstrating proper credential usage

Fixes #441"