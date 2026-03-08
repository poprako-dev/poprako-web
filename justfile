set shell := ["pwsh.exe", "-c"]

default:
    just --list

shad component:
    pnpm dlx shadcn@latest add {{component}}