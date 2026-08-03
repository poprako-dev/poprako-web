#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
release_test_root=$(mktemp -d "${TMPDIR:-/tmp}/poprako-web-release-test.XXXXXX")
deploy_test_root=$(mktemp -d "${TMPDIR:-/tmp}/poprako-web-deploy-test.XXXXXX")
success_bin=$(mktemp -d "${TMPDIR:-/tmp}/poprako-web-curl-success.XXXXXX")
failure_bin=$(mktemp -d "${TMPDIR:-/tmp}/poprako-web-curl-failure.XXXXXX")
release_sha=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
rollback_sha=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb

cleanup() {
    rm -rf \
        "$release_test_root" \
        "$deploy_test_root" \
        "$success_bin" \
        "$failure_bin"
}

trap cleanup EXIT INT TERM

cd "$project_root"

if RELEASE_DIR="$release_test_root" \
    RELEASE_SHA="$release_sha" \
    RELEASE_TAG=v0.1.0-untrusted \
    sh scripts/ci-release.sh \
        >/dev/null 2>&1; then
    echo "release accepted a non-semantic tag" >&2
    exit 1
fi

RELEASE_DIR="$release_test_root" \
RELEASE_SHA="$release_sha" \
RELEASE_TAG=v0.1.0 \
sh scripts/ci-release.sh

(cd "$release_test_root" && sha256sum --check SHA256SUMS)

mkdir -p \
    "$deploy_test_root/releases/$release_sha" \
    "$deploy_test_root/releases/$rollback_sha"

tar \
    -czf "$deploy_test_root/releases/$release_sha/poprako-web-sha-$release_sha.tar.gz" \
    -C dist \
    .
tar \
    -czf "$deploy_test_root/releases/$rollback_sha/poprako-web-sha-$rollback_sha.tar.gz" \
    -C dist \
    .

ln -s /usr/bin/true "$success_bin/curl"
ln -s /usr/bin/false "$failure_bin/curl"

PATH="$success_bin:$PATH" \
DEPLOY_HEALTH_ATTEMPTS=1 \
DEPLOY_HEALTH_DELAY_SECONDS=0 \
sh scripts/ga-remote-deploy.sh \
    "$release_sha" \
    "$deploy_test_root" \
    https://web.example.com/

first_site=$(readlink "$deploy_test_root/current")

PATH="$success_bin:$PATH" \
DEPLOY_HEALTH_ATTEMPTS=1 \
DEPLOY_HEALTH_DELAY_SECONDS=0 \
sh scripts/ga-remote-deploy.sh \
    "$release_sha" \
    "$deploy_test_root" \
    https://web.example.com/ \
    >/dev/null

[ "$(readlink "$deploy_test_root/current")" = "$first_site" ] || {
    echo "same-SHA deployment was not idempotent" >&2
    exit 1
}

if PATH="$failure_bin:$PATH" \
    DEPLOY_HEALTH_ATTEMPTS=1 \
    DEPLOY_HEALTH_DELAY_SECONDS=0 \
    sh scripts/ga-remote-deploy.sh \
        "$rollback_sha" \
        "$deploy_test_root" \
        https://web.example.com/ \
        >/dev/null 2>&1; then
    echo "rollback smoke test unexpectedly succeeded" >&2
    exit 1
fi

[ "$(readlink "$deploy_test_root/current")" = "$first_site" ] || {
    echo "failed deployment did not restore the previous release" >&2
    exit 1
}

echo "deployment artifact, idempotency, switch, and rollback smoke tests passed"
