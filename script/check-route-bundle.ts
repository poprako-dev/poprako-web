import type { Plugin } from "vite";

// Verify emitted modules, not merely the presence of autoCodeSplitting in config.
const PAGE_MODULES = [
  "login/business/LoginCard.tsx",
  "_authenticated/_shell/workspace/business/Workspace.tsx",
  "_authenticated/_shell/comic-playground/business/ComicPlayground.tsx",
  "_authenticated/_shell/member-list/business/MemberGlance.tsx",
  "_authenticated/_shell/system-mail/business/SystemMailViewer.tsx",
  "_authenticated/_shell/settings/business/SettingsPanel.tsx",
  "_authenticated/_shell/utilities/business/Utilities.tsx",
  "_authenticated/translator/business/remote/WebTranslator.tsx",
];

export function routeBundleGuard(): Plugin {
  return {
    name: "poprako-route-bundle-guard",
    apply: "build",
    generateBundle(_options, bundle) {
      const initialFiles = new Set<string>();
      const pending = Object.values(bundle)
        .filter((output) => output.type === "chunk" && output.isEntry)
        .map((output) => output.fileName);
      while (pending.length > 0) {
        const file = pending.pop();
        if (!file || initialFiles.has(file)) continue;
        initialFiles.add(file);
        const output = bundle[file];
        if (output?.type === "chunk") pending.push(...output.imports);
      }
      for (const page of PAGE_MODULES) {
        const owners = Object.values(bundle).filter(
          (output) =>
            output.type === "chunk" &&
            Object.keys(output.modules).some((id) =>
              id.replaceAll("\\", "/").endsWith(`/src/route/${page}`),
            ),
        );
        if (owners.length === 0) this.error(`Missing route page in production output: ${page}`);
        for (const owner of owners) {
          if (initialFiles.has(owner.fileName)) {
            this.error(`Route page leaked into the initial static dependency graph: ${page}`);
          }
        }
      }
      this.info(`Verified ${String(PAGE_MODULES.length)} pages outside the initial static graph.`);
    },
  };
}
