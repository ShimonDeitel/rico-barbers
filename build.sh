#!/usr/bin/env bash
# Collect only what belongs on the public web into dist/. Scripts, schema and notes
# stay out of it. Shop folders come along automatically.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
cd "$here"

rm -rf dist && mkdir -p dist
cp index.html app.js ui.js site.css dist/
cp favicon.ico favicon.svg apple-touch-icon.png dist/ 2>/dev/null || true
cp -R vendor dist/

# every customer folder (a directory holding its own index.html)
for d in */; do
  d=${d%/}
  case "$d" in dist|vendor|.git|node_modules) continue;; esac
  [ -f "$d/index.html" ] || continue
  mkdir -p "dist/$d"
  cp "$d/index.html" "dist/$d/"
  echo "  + $d"
done

echo "dist ready: $(find dist -type f | wc -l | tr -d ' ') files"
