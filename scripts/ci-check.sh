#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

run_deno() {
    command -v deno >/dev/null 2>&1 || {
        echo "Deno 2.9 is required to run CI checks." >&2
        exit 127
    }

    deno "$@"
}

cd "$project_root"

run_deno ci
run_deno task lint
run_deno task test:unit
run_deno task build
sh scripts/test-deployment.sh
run_deno task build-storybook
run_deno task test:storybook-start
