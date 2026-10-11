#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

run_pnpm() {
    command -v pnpm >/dev/null 2>&1 || {
        echo "Node.js 26 and pnpm 12.11.2 is required to build the application." >&2
        exit 127
    }

    pnpm "$@"
}

cd "$project_root"

sh script/assert-js-version.sh
run_pnpm install --frozen-lockfile
run_pnpm run prepare:dependencies
run_pnpm run build
