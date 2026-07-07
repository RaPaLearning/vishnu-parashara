#!/usr/bin/env bash
set -e

npm run lint
echo "✅ Linted"
npm test
echo "✅ Tested & Passed"
