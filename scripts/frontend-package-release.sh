#!/bin/sh
set -eu

IMAGE_TAG=${IMAGE_TAG:-$(git rev-parse --short=12 HEAD)}
SERVER_HOST=${SERVER_HOST:-${1:-}}
SERVER_USER=${SERVER_USER:-${2:-$(id -un)}}
DEPLOY_ROOT=${DEPLOY_ROOT:-/var/www/poprako-w}
DIST_DIR=${DIST_DIR:-dist}
RUN_REMOTE=${RUN_REMOTE:-0}
BUILD_COMMAND=${BUILD_COMMAND:-pnpm exec vite build}

if [ -z "$SERVER_HOST" ]; then
    printf '%s\n' "Usage: sh scripts/frontend-package-release.sh <server-host> [server-user]"
    printf '%s\n' "Default server user: $(id -un)"
    printf '%s\n' "Or set SERVER_HOST and SERVER_USER in the environment."
    exit 2
fi

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "${SCRIPT_DIR}/.." && pwd)
ARCHIVE_NAME="poprako-w-${IMAGE_TAG}.tar.gz"
REMOTE_RELEASE_DIR="${DEPLOY_ROOT}/releases/${IMAGE_TAG}"
REMOTE_BIN_DIR="${DEPLOY_ROOT}/shared/bin"
REMOTE_SCRIPT_NAME="frontend-switch-release.sh"
TMP_DIR=$(mktemp -d)
ARCHIVE_PATH="${TMP_DIR}/${ARCHIVE_NAME}"

cleanup() {
    rm -rf "$TMP_DIR"
}

trap cleanup EXIT INT TERM

cd "$ROOT_DIR"

printf '%s\n' "Building frontend with: ${BUILD_COMMAND}"
sh -c "$BUILD_COMMAND"
tar -czf "$ARCHIVE_PATH" -C "$DIST_DIR" .

ssh "${SERVER_USER}@${SERVER_HOST}" \
    "mkdir -p '${REMOTE_RELEASE_DIR}' '${REMOTE_BIN_DIR}'"
scp "$ARCHIVE_PATH" "${SERVER_USER}@${SERVER_HOST}:${REMOTE_RELEASE_DIR}/"
scp "${SCRIPT_DIR}/${REMOTE_SCRIPT_NAME}" \
    "${SERVER_USER}@${SERVER_HOST}:${REMOTE_BIN_DIR}/"
ssh "${SERVER_USER}@${SERVER_HOST}" \
    "chmod 755 '${REMOTE_BIN_DIR}/${REMOTE_SCRIPT_NAME}'"

printf '%s\n' \
    "Frontend release ${IMAGE_TAG} uploaded to ${SERVER_USER}@${SERVER_HOST}:${REMOTE_RELEASE_DIR}"

if [ "$RUN_REMOTE" = "1" ]; then
    ssh "${SERVER_USER}@${SERVER_HOST}" \
        "IMAGE_TAG='${IMAGE_TAG}' DEPLOY_ROOT='${DEPLOY_ROOT}' sh \
        '${REMOTE_BIN_DIR}/${REMOTE_SCRIPT_NAME}'"
else
    printf '%s\n' "Run on server:"
    printf '%s\n' \
        "IMAGE_TAG=${IMAGE_TAG} DEPLOY_ROOT=${DEPLOY_ROOT} sh"
    printf '%s\n' "${REMOTE_BIN_DIR}/${REMOTE_SCRIPT_NAME}"
fi