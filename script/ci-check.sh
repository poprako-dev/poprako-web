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

sh script/assert-deno-version.sh
run_deno ci
run_deno task prepare:dependencies
run_deno run -A npm:playwright@1.63.0 install --with-deps chromium
run_deno task check
run_deno task build
run_deno task build-storybook
run_deno task test:storybook-start
run_deno task test:compress-browser
run_deno task test:bounded-browser
sh script/test-deployment.sh
