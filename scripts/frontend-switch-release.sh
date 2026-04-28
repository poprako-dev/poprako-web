#!/bin/sh
set -eu

IMAGE_TAG=${IMAGE_TAG:?IMAGE_TAG is required}
DEPLOY_ROOT=${DEPLOY_ROOT:-/var/www/poprako-w}
WEB_USER=${WEB_USER:-www-data}
WEB_GROUP=${WEB_GROUP:-www-data}

ARCHIVE_NAME="poprako-w-${IMAGE_TAG}.tar.gz"
RELEASE_DIR="${DEPLOY_ROOT}/releases/${IMAGE_TAG}"
SITE_DIR="${RELEASE_DIR}/site"
CURRENT_LINK="${DEPLOY_ROOT}/current"
ARCHIVE_PATH="${RELEASE_DIR}/${ARCHIVE_NAME}"

[ -f "$ARCHIVE_PATH" ] || {
    echo "Missing ${ARCHIVE_PATH}" >&2
    exit 1
}

mkdir -p "$SITE_DIR"
rm -rf "${SITE_DIR:?}"/*
tar -xzf "$ARCHIVE_PATH" -C "$SITE_DIR"

ln -sfn "$SITE_DIR" "$CURRENT_LINK"

chown -R "${WEB_USER}:${WEB_GROUP}" "$SITE_DIR"
chown -h "${WEB_USER}:${WEB_GROUP}" "$CURRENT_LINK" 2>/dev/null || true
find "$SITE_DIR" -type d -exec chmod 755 {} +
find "$SITE_DIR" -type f -exec chmod 644 {} +

printf '%s\n' "Frontend release ${IMAGE_TAG} is now live at ${CURRENT_LINK}"