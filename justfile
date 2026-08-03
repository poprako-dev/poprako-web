default:
    just --list

shad component:
    pnpm dlx shadcn@latest add {{component}}

check:
    sh scripts/ci-check.sh

test:
    pnpm test:unit
