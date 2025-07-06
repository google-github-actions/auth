#!/bin/bash

# Create a temporary directory for the personal fork
TEMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TEMP_DIR"

# Clone your fork using gh CLI (which will use the correct credentials)
echo "Cloning your fork..."
gh repo clone bitsabhi/auth "$TEMP_DIR/auth" -- --quiet

# Copy the changes
echo "Copying changes..."
cd /Users/abhissrivasta/GolandProjects/auth
cp README.md "$TEMP_DIR/auth/"
cp docs/EXAMPLES.md "$TEMP_DIR/auth/docs/"
cp docs/TROUBLESHOOTING.md "$TEMP_DIR/auth/docs/"

# Push the changes
cd "$TEMP_DIR/auth"
git checkout -b fix-id-token-refresh-issue-441
git add .
git commit -m "docs: Add troubleshooting for Python ID token refresh error

This addresses issue #441 where users encounter an error when trying to refresh credentials to retrieve an ID token in Python code. The error occurs because the Google Auth library requires scopes to be set when refreshing credentials for impersonation.

Changes:
- Added new troubleshooting section explaining the ID token refresh error
- Provided solution with code example showing how to add scopes before refreshing
- Added Python usage note in README.md with quick reference
- Enhanced examples with Python code demonstrating proper credential usage

Fixes #441

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo "Pushing to your fork..."
git push -u origin fix-id-token-refresh-issue-441

echo "Cleaning up..."
rm -rf "$TEMP_DIR"

echo "Done! Now create a PR at: https://github.com/bitsabhi/auth/pull/new/fix-id-token-refresh-issue-441"