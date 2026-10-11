#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

command -v pnpm >/dev/null 2>&1 || {
    echo "Node.js 26 and pnpm 12.11.2 is required to audit dependencies." >&2
    exit 127
}

cd "$project_root"

sh script/assert-js-version.sh
pnpm install --frozen-lockfile
pnpm audit --audit-level high
