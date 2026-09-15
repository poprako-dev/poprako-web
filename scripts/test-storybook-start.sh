#!/usr/bin/env sh
set -eu

deno test -A scripts/storybook-deno.test.mjs
deno task storybook --ci --smoke-test --no-open --disable-telemetry
