#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

run_deno() {
    command -v deno >/dev/null 2>&1 || {
        echo "Deno 2.9 is required to build the application." >&2
        exit 127
    }

    deno "$@"
}

cd "$project_root"

sh script/assert-deno-version.sh
run_deno ci
run_deno task prepare:dependencies
run_deno task build
