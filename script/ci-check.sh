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

suite=${1:-all}
case "$suite" in
    all | static | browser | build) ;;
    *)
        echo "Unknown frontend check suite: $suite" >&2
        exit 1
        ;;
esac

sh script/assert-deno-version.sh
run_deno ci
run_deno task prepare:dependencies

wait_checks() {
    check_status=0
    for check_pid in "$@"; do
        wait "$check_pid" || check_status=1
    done
    return "$check_status"
}

check_source() {
    run_deno task format:check
    run_deno task project:check
    run_deno task generate:check
    run_deno task test:unit
    run_deno task test:integration
    run_deno task test:script
}

check_static() {
    run_deno task typecheck &
    typecheck_pid=$!
    run_deno task lint &
    lint_pid=$!
    check_source &
    source_pid=$!
    wait_checks "$typecheck_pid" "$lint_pid" "$source_pid"
}

check_browser() {
    run_deno run -A npm:playwright@1.63.0 install --with-deps chromium
    run_deno task test:storybook
    run_deno task test:compress-browser
    run_deno task test:bounded-browser
}

check_build() {
    # The static suite owns type checking; CI requires every suite to pass.
    run_deno run -A npm:vite@8.0.16 build
    sh script/test-deployment.sh
}

case "$suite" in
    static) check_static ;;
    browser) check_browser ;;
    build) check_build ;;
    all)
        check_static &
        static_pid=$!
        check_browser &
        browser_pid=$!
        check_build &
        build_pid=$!
        wait_checks "$static_pid" "$browser_pid" "$build_pid"
        ;;
esac
