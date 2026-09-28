#!/usr/bin/env sh
set -eu

if [ "$#" -ne 3 ]; then
    echo "expected commit SHA, deploy root, and health-check URL" >&2
    exit 1
fi

release_sha=$1
deploy_root=$2
healthcheck_url=$3
health_attempt_limit=${DEPLOY_HEALTH_ATTEMPTS:-10}
health_delay_seconds=${DEPLOY_HEALTH_DELAY_SECONDS:-2}

case "$release_sha" in
    *[!0-9a-f]*)
        echo "release SHA must be lowercase hexadecimal" >&2
        exit 1
        ;;
esac

[ "${#release_sha}" -eq 40 ] || {
    echo "release SHA must contain exactly 40 characters" >&2
    exit 1
}

case "$deploy_root" in
    / | /opt | /srv | /var | /var/www)
        echo "deploy root must identify a dedicated application directory" >&2
        exit 1
        ;;
    /*) ;;
    *)
        echo "deploy root must be absolute" >&2
        exit 1
        ;;
esac

case "$deploy_root" in
    *[!A-Za-z0-9_./-]*)
        echo "deploy root contains unsupported characters" >&2
        exit 1
        ;;
esac

case "$deploy_root" in
    */../* | */.. | */./* | */.)
        echo "deploy root must not contain dot path segments" >&2
        exit 1
        ;;
esac

case "$healthcheck_url" in
    http://* | https://*) ;;
    *)
        echo "health-check URL must use HTTP or HTTPS" >&2
        exit 1
        ;;
esac

case "$health_attempt_limit" in
    "" | *[!0-9]*)
        echo "health attempt limit must be numeric" >&2
        exit 1
        ;;
esac

[ "$health_attempt_limit" -gt 0 ] || {
    echo "health attempt limit must be greater than zero" >&2
    exit 1
}

case "$health_delay_seconds" in
    "" | *[!0-9]*)
        echo "health delay must be numeric" >&2
        exit 1
        ;;
esac

release_dir="${deploy_root}/releases/${release_sha}"
site_dir="${release_dir}/site"
archive_file="${release_dir}/poprako-web-sha-${release_sha}.tar.gz"
current_link="${deploy_root}/current"
previous_link="${deploy_root}/previous"
old_site=

is_commit_sha() {
    candidate_sha=$1

    [ "${#candidate_sha}" -eq 40 ] || return 1

    case "$candidate_sha" in
        *[!0-9a-f]*) return 1 ;;
    esac
}

[ -f "$archive_file" ] || {
    echo "missing uploaded artifact: $archive_file" >&2
    exit 1
}

if [ -L "$current_link" ]; then
    old_site=$(readlink "$current_link")

    case "$old_site" in
        "${deploy_root}/releases/"*/site) ;;
        *)
            echo "current symlink points outside the managed release layout" >&2
            exit 1
            ;;
    esac

    old_release_dir=${old_site%/site}
    old_release_sha=${old_release_dir##*/}

    is_commit_sha "$old_release_sha" || {
        echo "current symlink does not identify a commit release" >&2
        exit 1
    }
fi

if [ "$old_site" = "$site_dir" ]; then
    [ -f "$site_dir/index.html" ] || {
        echo "current release is incomplete; refusing an in-place replacement" >&2
        exit 1
    }
else
    rm -rf "$site_dir"
    mkdir -p "$site_dir"
    tar -xzf "$archive_file" -C "$site_dir"

    [ -f "$site_dir/index.html" ] || {
        echo "release does not contain index.html" >&2
        exit 1
    }

    if [ -n "$old_site" ]; then
        ln -sfn "$old_site" "$previous_link"
    fi

    ln -sfn "$site_dir" "$current_link"
fi

health_ok=0
health_attempt=1

while [ "$health_attempt" -le "$health_attempt_limit" ]; do
    if curl \
        --fail \
        --silent \
        --show-error \
        --location \
        --max-time 10 \
        "$healthcheck_url" \
        >/dev/null; then
        health_ok=1
        break
    fi

    health_attempt=$((health_attempt + 1))
    if [ "$health_delay_seconds" -gt 0 ]; then
        sleep "$health_delay_seconds"
    fi
done

if [ "$health_ok" != "1" ]; then
    if [ -n "$old_site" ] && [ -f "$old_site/index.html" ]; then
        ln -sfn "$old_site" "$current_link"
        echo "health check failed; previous frontend release restored" >&2
    else
        rm -f "$current_link"
        echo "health check failed and no previous release exists" >&2
    fi

    exit 1
fi

old_release_sha=${old_release_sha:-}

for candidate_dir in "${deploy_root}/releases/"*; do
    [ -d "$candidate_dir" ] || continue

    candidate_sha=${candidate_dir##*/}
    is_commit_sha "$candidate_sha" || continue

    case "$candidate_sha" in
        "$release_sha" | "$old_release_sha") continue ;;
    esac

    rm -rf "$candidate_dir"
done

printf 'deployed_commit=%s\n' "$release_sha"
printf 'current_site=%s\n' "$(readlink "$current_link")"
printf 'healthcheck=passed\n'
