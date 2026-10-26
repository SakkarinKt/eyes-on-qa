#!/bin/sh
# Point git at the repository's hooks so the pre-push guard applies to every clone that runs this once.
set -e
cd "$(dirname "$0")/.."
git config core.hooksPath scripts/hooks
chmod +x scripts/hooks/*
echo "hooks installed: core.hooksPath=scripts/hooks"
