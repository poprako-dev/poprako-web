#!/usr/bin/env sh
set -eu

command -v deno >/dev/null 2>&1 || {
    echo "Deno 2.9 is required." >&2
    exit 127
}

deno_version=$(deno --version | sed -n '1s/^deno //p')
case "$deno_version" in
    2.9.*) ;;
    *)
        echo "Deno 2.9 is required; found ${deno_version:-unknown}." >&2
        exit 1
        ;;
esac
