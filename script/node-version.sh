#!/usr/bin/env sh

# October 2026 security fixes, including CVE-2026-111497, require this release.
minimum_node_version=26.12.1

assert_node_range() {
    [ "$1" = '^26.12' ] || {
        echo "The supported Node.js range must be ^26.12" >&2
        return 1
    }
}

assert_safe_node_version() {
    printf '%s\n' "$1" | awk -v minimum="$minimum_node_version" '
        /^v?26\.[0-9]+\.[0-9]+$/ {
            sub(/^v/, "")
            split($0, version, ".")
            split(minimum, floor, ".")
            if (version[2] > floor[2] ||
                (version[2] == floor[2] && version[3] >= floor[3])) valid = 1
        }
        END { exit !valid }
    ' || {
        echo "Node.js ^26.12, at least $minimum_node_version, is required for security fixes." >&2
        return 1
    }
}

latest_node_version() {
    awk '
        $1 ~ /^v26\.[0-9]+\.[0-9]+$/ {
            split(substr($1, 2), version, ".")
            if (latest == "" || version[2] > minor ||
                (version[2] == minor && version[3] > patch)) {
                latest = substr($1, 2)
                minor = version[2] + 0
                patch = version[3] + 0
            }
        }
        END { if (latest != "") print latest; else exit 1 }
    ' "$1"
}
