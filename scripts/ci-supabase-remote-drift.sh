#!/usr/bin/env bash
# Fail if the linked Supabase project has migrations in git that are not yet applied remotely.
# Requires: supabase link (CI), SUPABASE_DB_PASSWORD, Supabase CLI.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "::error::SUPABASE_DB_PASSWORD is not set"
  exit 1
fi

# --yes avoids interactive prompts in CI
out=$(supabase db push --linked --dry-run --yes -p "$SUPABASE_DB_PASSWORD" 2>&1) || {
  echo "$out"
  echo "::error::supabase db push --dry-run failed (link, password, or CLI error)."
  exit 1
}

echo "$out"

if echo "$out" | grep -qiE 'Would push migration|Would apply migration|Applying migration'; then
  echo "::error::Production (linked) database is behind git migrations. Run the Deploy to Production workflow or supabase db push."
  exit 1
fi

if echo "$out" | grep -qiE 'diverge|diverged|migration history|repair required'; then
  echo "::error::Migration history may be diverged. See supabase migration list and docs/SUPABASE_DEPLOY.md."
  exit 1
fi

echo "OK: no pending migrations reported for linked project."
