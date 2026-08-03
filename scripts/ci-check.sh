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

run_pnpm install --frozen-lockfile
run_pnpm lint
run_pnpm test:unit
run_pnpm build
sh scripts/test-deployment.sh
run_pnpm build-storybook

if [ -n "${LINE_LENGTH_BASE_SHA:-}" ]; then
    sh scripts/ci-line-length.sh "$LINE_LENGTH_BASE_SHA"
fi
