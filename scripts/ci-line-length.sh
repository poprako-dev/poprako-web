#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
base_sha=${1:-}
baseline_file=${2:-$project_root/scripts/line-length-baseline.txt}

cd "$project_root"

if [ -z "$base_sha" ] || ! git cat-file -e "${base_sha}^{commit}" 2>/dev/null; then
    if git cat-file -e HEAD^ 2>/dev/null; then
        base_sha=HEAD^
    else
        echo "No base commit is available for incremental line-length checking."
        exit 0
    fi
fi

[ -f "$baseline_file" ] || {
    echo "Line-length baseline is missing: $baseline_file" >&2
    exit 1
}

node scripts/check-added-line-length.mjs "$base_sha" "$baseline_file"
