#!/usr/bin/env bash
set -e

npx eslint .
echo "✅ Linted"
npm test
echo "✅ Tested & Passed"
