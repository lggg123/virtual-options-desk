#!/bin/bash

# 🚀 Quick Git Push Script
# This script helps you commit and push your virtual-options-desk changes

set -e  # Exit on error

echo "🚀 Virtual Options Desk - Git Push Helper"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo -e "${RED}❌ Error: Not in a git repository!${NC}"
    echo "   Run this script from /workspaces/virtual-options-desk"
    exit 1
fi

echo "📊 Checking repository status..."
echo ""

# Show current branch
BRANCH=$(git branch --show-current)
echo -e "${GREEN}Current branch:${NC} $BRANCH"
echo ""

# Check for uncommitted changes
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${GREEN}✅ No uncommitted changes${NC}"
    echo "   Your working directory is clean!"
    echo ""
    echo "📤 Pushing to origin..."
    git push origin "$BRANCH"
    echo -e "${GREEN}✅ Successfully pushed to origin/$BRANCH${NC}"
    exit 0
fi

# Show status
echo "📝 Git Status:"
echo "=============="
git status --short
echo ""

# Count files
UNTRACKED=$(git ls-files --others --exclude-standard | wc -l)
MODIFIED=$(git diff --name-only | wc -l)
STAGED=$(git diff --cached --name-only | wc -l)

echo "📊 Summary:"
echo "  - Untracked files: $UNTRACKED"
echo "  - Modified files: $MODIFIED"
echo "  - Staged files: $STAGED"
echo ""

# Ask what to do
echo "What would you like to do?"
echo ""
echo "1) Add ALL changes and commit"
echo "2) Add PATTERN DETECTION files only"
echo "3) Add MOBILE files only"
echo "4) Add DOCUMENTATION only"
echo "5) Show detailed status"
echo "6) Cancel"
echo ""

read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        echo ""
        echo "➕ Adding all changes..."
        git add .
        echo -e "${GREEN}✅ All changes staged${NC}"
        ;;
    2)
        echo ""
        echo "➕ Adding pattern detection files..."
        git add python/pattern_detector.py || true
        git add python/pattern_detection_api.py || true
        git add src/app/api/patterns/ || true
        git add start-pattern-service.sh || true
        git add test-pattern-detection.py || true
        git add python/requirements-ml.txt || true
        echo -e "${GREEN}✅ Pattern detection files staged${NC}"
        ;;
    3)
        echo ""
        echo "➕ Adding mobile files..."
        git add mobile/lib/ || true
        git add mobile/pubspec.yaml || true
        echo -e "${GREEN}✅ Mobile files staged${NC}"
        ;;
    4)
        echo ""
        echo "➕ Adding documentation files..."
        git add docs/ || true
        git add *.md || true
        echo -e "${GREEN}✅ Documentation files staged${NC}"
        ;;
    5)
        echo ""
        git status
        echo ""
        echo "Run script again to commit changes."
        exit 0
        ;;
    6)
        echo ""
        echo "❌ Cancelled"
        exit 0
        ;;
    *)
        echo ""
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

# Show what will be committed
echo ""
echo "📦 Files to be committed:"
echo "========================"
git diff --cached --name-only
echo ""

# Get commit message
echo "Enter commit message (or press Enter for default):"
read -p "Message: " commit_msg

if [ -z "$commit_msg" ]; then
    commit_msg="feat: Update virtual options desk

- Add AI candlestick pattern detection
- Update mobile integration
- Add comprehensive documentation"
fi

# Commit
echo ""
echo "💾 Committing changes..."
git commit -m "$commit_msg"
echo -e "${GREEN}✅ Changes committed${NC}"

# Ask to push
echo ""
read -p "📤 Push to origin/$BRANCH? [Y/n]: " push_choice

if [ "$push_choice" = "n" ] || [ "$push_choice" = "N" ]; then
    echo ""
    echo "ℹ️  Changes committed but not pushed."
    echo "   Run 'git push origin $BRANCH' when ready."
    exit 0
fi

# Push
echo ""
echo "📤 Pushing to origin/$BRANCH..."
if git push origin "$BRANCH"; then
    echo ""
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
    echo ""
    echo "🎉 All done!"
    echo ""
    echo "View your changes at:"
    REMOTE_URL=$(git config --get remote.origin.url)
    if [[ $REMOTE_URL == *"github.com"* ]]; then
        REPO=$(echo $REMOTE_URL | sed 's/.*github.com[:/]\(.*\)\.git/\1/')
        echo "   https://github.com/$REPO"
    fi
else
    echo ""
    echo -e "${RED}❌ Push failed!${NC}"
    echo ""
    echo "This might be because:"
    echo "  1. You need to pull changes first: git pull origin $BRANCH"
    echo "  2. You don't have push permissions"
    echo "  3. Network issue"
    echo ""
    echo "Try running:"
    echo "  git pull origin $BRANCH"
    echo "  git push origin $BRANCH"
    exit 1
fi
