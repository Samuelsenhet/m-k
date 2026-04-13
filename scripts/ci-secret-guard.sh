#!/usr/bin/env bash
# Fail CI if client-side trees contain patterns that usually mean embedded secrets.
# Edge code under supabase/functions/ is intentionally excluded.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# GNU grep extended regex (GitHub Actions ubuntu)
PATTERN='SUPABASE_SERVICE_ROLE_KEY|ANTHROPIC_API_KEY[[:space:]]*=|RESEND_API_KEY[[:space:]]*=|sk_live_[0-9a-zA-Z]+|OPENAI_API_KEY[[:space:]]*=|LOVABLE_API_KEY[[:space:]]*='

scan_dir() {
  local dir="$1"
  if [[ ! -d "$dir" ]]; then
    return 0
  fi
  if grep -rEn --exclude-dir=node_modules --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' "$PATTERN" "$dir" 2>/dev/null; then
    echo "::error::Forbidden secret-like pattern in ${dir}/ (client bundle). Use Edge secrets + Deno.env instead."
    return 1
  fi
  return 0
}

fail=0
scan_dir src || fail=1
scan_dir apps/mobile || fail=1
scan_dir packages/core || fail=1

exit "$fail"
