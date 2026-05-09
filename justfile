default:
    just --list

shad component:
    pnpm dlx shadcn@latest add {{component}}

package-release:
    sh scripts/frontend-package-release.sh