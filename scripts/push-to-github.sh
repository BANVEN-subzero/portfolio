#!/bin/bash
# Push the portfolio to GitHub in one command.
# Usage: bash scripts/push-to-github.sh <YOUR_GITHUB_PAT>
#
# Create a PAT at: https://github.com/settings/tokens/new?scopes=repo,read:user
# Set expiration to 30 days, give it "repo" scope.

set -e

TOKEN="$1"
if [ -z "$TOKEN" ]; then
  echo "Usage: bash scripts/push-to-github.sh <YOUR_GITHUB_PAT>"
  echo "Create a token at: https://github.com/settings/tokens/new?scopes=repo"
  exit 1
fi

REPO_NAME="portfolio"
REPO_DESC="Banven Eric — Software Engineering Portfolio. Holographic 66k-dot point cloud hero, editorial design, project case studies."
GH_USER="BANVEN-subzero"

cd /home/z/my-project

echo "1. Creating GitHub repo '$REPO_NAME'..."
RESP=$(curl -s -w "\n%{http_code}" -X POST "https://api.github.com/user/repos" \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"$REPO_DESC\",\"private\":false}")

HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
  echo "   ✓ Repo created at https://github.com/$GH_USER/$REPO_NAME"
elif [ "$HTTP_CODE" = "422" ]; then
  echo "   ℹ Repo already exists — continuing with push"
else
  echo "   ✗ Failed to create repo (HTTP $HTTP_CODE)"
  echo "$BODY" | head -5
  exit 1
fi

echo "2. Setting remote URL with token..."
git remote set-url origin "https://$TOKEN@github.com/$GH_USER/$REPO_NAME.git"

echo "3. Pushing to GitHub..."
git push -u origin main 2>&1 || {
  # If main fails, try master
  echo "   Trying master branch..."
  git push -u origin master 2>&1
}

echo ""
echo "✓ Done! Your portfolio is live at:"
echo "  https://github.com/$GH_USER/$REPO_NAME"

# Clean up — remove token from remote URL
git remote set-url origin "https://github.com/$GH_USER/$REPO_NAME.git"
echo "(Token removed from git config for safety)"
