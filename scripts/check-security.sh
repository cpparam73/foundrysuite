#!/usr/bin/env bash
# Local / CI helper: verify HTML security meta consistency.
set -euo pipefail

required=(
  'Content-Security-Policy'
  "script-src 'self'"
  "script-src-attr 'none'"
  "object-src 'none'"
  "frame-src 'none'"
  "worker-src 'none'"
  'X-Content-Type-Options'
  'X-Frame-Options'
  'Referrer-Policy'
  'Permissions-Policy'
  'X-Permitted-Cross-Domain-Policies'
  'upgrade-insecure-requests'
)

pages=(index.html foundry-platform.html login.html platform.html)

for page in "${pages[@]}"; do
  echo "Checking $page"
  test -f "$page"
  for needle in "${required[@]}"; do
    if ! grep -Fq "$needle" "$page"; then
      echo "Missing security control in $page: $needle" >&2
      exit 1
    fi
  done
done

if grep -RInE --include='*.html' '[[:space:]]on[a-zA-Z]+=' .; then
  echo "Inline event handlers found in HTML" >&2
  exit 1
fi

if grep -RInE --include='*.html' 'javascript:' .; then
  echo "javascript: URLs found in HTML" >&2
  exit 1
fi

test -f assets/js/core/security-manager.js
test -f assets/js/core/content-protection.js
test -f assets/js/core/theme-init.js
grep -Fq 'javascript|data|vbscript' assets/js/core/security-manager.js

echo "All security checks passed."
