default:
    just --list

shad component:
    pnpm dlx shadcn@latest add {{component}}

check:
    sh script/ci-check.sh

test:
    pnpm run test:unit
