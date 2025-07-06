#!/bin/bash

# Script to add your personal fork and push the changes

# Add your personal fork as a remote (replace YOUR_GITHUB_USERNAME with your actual username)
echo "Adding your personal fork as remote..."
git remote add personal https://github.com/YOUR_GITHUB_USERNAME/auth.git

# Push to your personal fork
echo "Pushing to your personal fork..."
git push -u personal fix-id-token-refresh-issue-441

echo "Done! Now you can create a PR from your fork to the upstream repository."
echo "Visit: https://github.com/YOUR_GITHUB_USERNAME/auth/pull/new/fix-id-token-refresh-issue-441"