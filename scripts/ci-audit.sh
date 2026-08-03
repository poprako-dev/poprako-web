#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

run_pnpm() {
    if command -v pnpm >/dev/null 2>&1; then
        pnpm "$@"
        return
    fi

    corepack pnpm "$@"
}

cd "$project_root"

run_pnpm audit --prod --audit-level high
