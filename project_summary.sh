#!/bin/bash

# Script: project_summary.sh
# Purpose: Collect project info for review or analysis
# Usage: ./project_summary.sh > project_summary.txt

echo "=============================="
echo "PROJECT SUMMARY - $(pwd)"
echo "=============================="
echo ""

# 1. List project files
echo "1. File structure:"
find . -type f | sed 's|^\./||' | sort
echo ""
echo "------------------------------"

# 2. List directories
echo "2. Directories:"
find . -type d | sed 's|^\./||' | sort
echo ""
echo "------------------------------"

# 3. Check for package.json (Node.js project)
if [ -f package.json ]; then
    echo "3. Dependencies (package.json):"
    echo ""
    echo "Dependencies:"
    jq '.dependencies' package.json
    echo ""
    echo "DevDependencies:"
    jq '.devDependencies' package.json
    echo ""
    echo "Scripts:"
    jq '.scripts' package.json
else
    echo "3. No package.json found."
fi
echo "------------------------------"

# 4. List git info
if [ -d .git ]; then
    echo "4. Git info:"
    echo "Current branch: $(git branch --show-current)"
    echo "Latest 5 commits:"
    git log -n 5 --oneline
else
    echo "4. No git repository found."
fi
echo "------------------------------"

# 5. List main code files (js, ts, tsx, py)
echo "5. Main code files:"
find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.py" \) | sed 's|^\./||' | sort
echo "------------------------------"

# 6. Optional: Node version
if command -v node >/dev/null 2>&1; then
    echo "6. Node version: $(node -v)"
fi

# 7. Optional: npm version
if command -v npm >/dev/null 2>&1; then
    echo "7. NPM version: $(npm -v)"
fi

# 8. Optional: List installed node modules
if [ -d node_modules ]; then
    echo "8. Top-level node_modules:"
    ls node_modules | sort
fi

echo "=============================="
echo "END OF PROJECT SUMMARY"
echo "=============================="
