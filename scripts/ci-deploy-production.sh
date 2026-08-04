#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
runner_temp=${RUNNER_TEMP:-${TMPDIR:-/tmp}}

deploy_host=${DEPLOY_HOST:?DEPLOY_HOST is required}
deploy_user=${DEPLOY_USER:?DEPLOY_USER is required}
deploy_port=${DEPLOY_PORT:?DEPLOY_PORT is required}
deploy_root=${DEPLOY_ROOT:?DEPLOY_ROOT is required}
deploy_sha=${DEPLOY_SHA:?DEPLOY_SHA is required}
deploy_healthcheck_url=${DEPLOY_HEALTHCHECK_URL:?DEPLOY_HEALTHCHECK_URL is required}
deploy_private_key=${DEPLOY_SSH_PRIVATE_KEY:?DEPLOY_SSH_PRIVATE_KEY is required}
deploy_known_hosts=${DEPLOY_KNOWN_HOSTS:?DEPLOY_KNOWN_HOSTS is required}
vite_api_base_url=${VITE_API_BASE_URL:?VITE_API_BASE_URL is required}

validate_simple_value() {
    value=$1
    label=$2

    case "$value" in
        "" | *[!A-Za-z0-9._-]*)
            echo "$label contains unsupported characters" >&2
            exit 1
            ;;
    esac
}

validate_simple_value "$deploy_host" DEPLOY_HOST
validate_simple_value "$deploy_user" DEPLOY_USER

case "$deploy_port" in
    "" | *[!0-9]*)
        echo "DEPLOY_PORT must be numeric" >&2
        exit 1
        ;;
esac

if [ "$deploy_port" -lt 1 ] || [ "$deploy_port" -gt 65535 ]; then
    echo "DEPLOY_PORT must be between 1 and 65535" >&2
    exit 1
fi

case "$deploy_root" in
    / | /opt | /srv | /var | /var/www)
        echo "DEPLOY_ROOT must identify a dedicated application directory" >&2
        exit 1
        ;;
    /*) ;;
    *)
        echo "DEPLOY_ROOT must be an absolute path" >&2
        exit 1
        ;;
esac

case "$deploy_root" in
    *[!A-Za-z0-9_./-]*)
        echo "DEPLOY_ROOT contains unsupported characters" >&2
        exit 1
        ;;
esac

case "$deploy_root" in
    */../* | */.. | */./* | */.)
        echo "DEPLOY_ROOT must not contain dot path segments" >&2
        exit 1
        ;;
esac

case "$deploy_healthcheck_url" in
    http://* | https://*) ;;
    *)
        echo "DEPLOY_HEALTHCHECK_URL must use HTTP or HTTPS" >&2
        exit 1
        ;;
esac

case "$deploy_healthcheck_url" in
    *"'"* | *[[:space:]]*)
        echo "DEPLOY_HEALTHCHECK_URL contains quotes or whitespace" >&2
        exit 1
        ;;
esac

case "$vite_api_base_url" in
    https://api.poprako.com/api/v1) ;;
    *)
        echo "VITE_API_BASE_URL must be https://api.poprako.com/api/v1" >&2
        exit 1
        ;;
esac

case "$deploy_sha" in
    *[!0-9a-f]*)
        echo "DEPLOY_SHA must be a lowercase hexadecimal commit SHA" >&2
        exit 1
        ;;
esac

[ "${#deploy_sha}" -eq 40 ] || {
    echo "DEPLOY_SHA must contain exactly 40 characters" >&2
    exit 1
}

artifact_name="poprako-web-sha-${deploy_sha}.tar.gz"
artifact_path="${runner_temp}/${artifact_name}"
release_dir="${deploy_root}/releases/${deploy_sha}"
ssh_root="${runner_temp}/poprako-web-deploy-ssh"
private_key_file="${ssh_root}/id_ed25519"
known_hosts_file="${ssh_root}/known_hosts"
ssh_target="${deploy_user}@${deploy_host}"

cleanup() {
    rm -f "$private_key_file" "$known_hosts_file" "$artifact_path"
    rmdir "$ssh_root" >/dev/null 2>&1 || true
}

trap cleanup EXIT
trap 'exit 1' INT TERM

cd "$project_root"
export VITE_API_BASE_URL="$vite_api_base_url"
sh scripts/ci-build.sh
tar -czf "$artifact_path" -C dist .

umask 077
mkdir -p "$ssh_root"
printf '%s\n' "$deploy_private_key" >"$private_key_file"
printf '%s\n' "$deploy_known_hosts" >"$known_hosts_file"

ssh \
    -i "$private_key_file" \
    -p "$deploy_port" \
    -o BatchMode=yes \
    -o IdentitiesOnly=yes \
    -o StrictHostKeyChecking=yes \
    -o "UserKnownHostsFile=$known_hosts_file" \
    "$ssh_target" \
    "mkdir -p '$release_dir'"

scp \
    -i "$private_key_file" \
    -P "$deploy_port" \
    -o BatchMode=yes \
    -o IdentitiesOnly=yes \
    -o StrictHostKeyChecking=yes \
    -o "UserKnownHostsFile=$known_hosts_file" \
    "$artifact_path" \
    "scripts/ga-remote-deploy.sh" \
    "${ssh_target}:${release_dir}/"

ssh \
    -i "$private_key_file" \
    -p "$deploy_port" \
    -o BatchMode=yes \
    -o IdentitiesOnly=yes \
    -o StrictHostKeyChecking=yes \
    -o "UserKnownHostsFile=$known_hosts_file" \
    "$ssh_target" \
    "sh '$release_dir/ga-remote-deploy.sh' \
        '$deploy_sha' '$deploy_root' '$deploy_healthcheck_url'"
