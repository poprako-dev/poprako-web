#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
release_root=${RELEASE_DIR:?RELEASE_DIR is required}
release_sha=${RELEASE_SHA:?RELEASE_SHA is required}
release_tag=${RELEASE_TAG:?RELEASE_TAG is required}

is_digits() {
    value=$1

    case "$value" in
        "" | *[!0-9]*) return 1 ;;
    esac
}

version=${release_tag#v}
major=${version%%.*}
minor_patch=${version#*.}
minor=${minor_patch%%.*}
patch=${minor_patch#*.}

if [ "$version" = "$release_tag" ] || \
    [ "$minor_patch" = "$version" ] || \
    [ "$patch" = "$minor_patch" ] || \
    [ "$patch" != "${patch%%.*}" ] || \
    ! is_digits "$major" || \
    ! is_digits "$minor" || \
    ! is_digits "$patch"; then
    echo "RELEASE_TAG must use vMAJOR.MINOR.PATCH format" >&2
    exit 1
fi

case "$release_sha" in
    *[!0-9a-f]*)
        echo "RELEASE_SHA must be a lowercase hexadecimal commit SHA" >&2
        exit 1
        ;;
esac

[ "${#release_sha}" -eq 40 ] || {
    echo "RELEASE_SHA must contain exactly 40 characters" >&2
    exit 1
}

case "$release_root" in
    / | "")
        echo "RELEASE_DIR must identify a dedicated directory" >&2
        exit 1
        ;;
esac

site_root="$project_root/dist"
artifact_name="poprako-web-${release_tag}"
archive_file="${release_root}/${artifact_name}.tar.gz"
dependency_file="${release_root}/${artifact_name}.pnpm-lock.yaml"
provenance_file="${release_root}/${artifact_name}.provenance.json"

[ -f "$site_root/index.html" ] || {
    echo "dist/index.html is missing; run the required checks first" >&2
    exit 1
}

mkdir -p "$release_root"
tar -czf "$archive_file" -C "$site_root" .

cd "$project_root"
cp pnpm-lock.yaml "$dependency_file"

node_version=$(node --version)

if command -v pnpm >/dev/null 2>&1; then
    pnpm_version=$(pnpm --version)
else
    pnpm_version=$(corepack pnpm --version)
fi

printf '{\n  "source_commit": "%s",\n' "$release_sha" >"$provenance_file"
printf '  "release_tag": "%s",\n' "$release_tag" >>"$provenance_file"
printf '  "node": "%s",\n' "$node_version" >>"$provenance_file"
printf '  "pnpm": "%s",\n' "$pnpm_version" >>"$provenance_file"
printf '  "builder": "github-actions"\n}\n' >>"$provenance_file"

cd "$release_root"
sha256sum \
    "${artifact_name}.tar.gz" \
    "${artifact_name}.pnpm-lock.yaml" \
    "${artifact_name}.provenance.json" \
    >SHA256SUMS
