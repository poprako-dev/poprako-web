#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

command -v deno >/dev/null 2>&1 || {
    echo "Deno 2.9 is required to audit dependencies." >&2
    exit 127
}

cd "$project_root"

sh script/assert-deno-version.sh
deno ci
deno audit --frozen --level=high
