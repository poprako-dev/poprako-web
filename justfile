default:
    just --list

check:
    sh script/ci-check.sh

test:
    pnpm run test:unit
