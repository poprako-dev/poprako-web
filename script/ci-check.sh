#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

run_pnpm() {
    command -v pnpm >/dev/null 2>&1 || {
        echo "Node.js 26 and pnpm 12.11.2 is required to run CI checks." >&2
        exit 127
    }

    pnpm "$@"
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

sh script/assert-js-version.sh
run_pnpm install --frozen-lockfile
run_pnpm run prepare:dependencies

wait_checks() {
    check_status=0
    for check_pid in "$@"; do
        wait "$check_pid" || check_status=1
    done
    return "$check_status"
}

check_source() {
    run_pnpm run format:check
    run_pnpm run project:check
    run_pnpm run generate:check
    run_pnpm run test:unit
    run_pnpm run test:integration
    run_pnpm run test:script --exclude script/translator-undo-browser.test.ts
}

check_static() {
    run_pnpm run typecheck &
    typecheck_pid=$!
    run_pnpm run lint &
    lint_pid=$!
    check_source &
    source_pid=$!
    wait_checks "$typecheck_pid" "$lint_pid" "$source_pid"
}

check_browser() {
    run_pnpm exec playwright install --with-deps chromium
    run_pnpm run test:translator-undo-browser
    run_pnpm run test:storybook
    run_pnpm run test:storybook-start
    run_pnpm run test:compress-browser
    run_pnpm run test:bounded-browser
}

check_build() {
    # The static suite owns type checking; CI requires every suite to pass.
    run_pnpm exec vite build
    run_pnpm run build-storybook
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
