default:
    just --list

shad component:
    deno run -A npm:shadcn@latest add {{component}}

check:
    sh script/ci-check.sh

test:
    deno task test:unit
