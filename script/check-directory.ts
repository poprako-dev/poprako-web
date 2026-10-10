import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Finding } from "./check-style.ts";

// Reviewed vocabulary, not a suffix heuristic: business and status are singular words.
const OWNED_NAME = new Set([
  "announcement",
  "api",
  "app-dialog",
  "application",
  "artwork",
  "assignment",
  "assignment-invitation",
  "auth",
  "business",
  "button",
  "canvas",
  "chapter",
  "comic",
  "comic-detail",
  "comic-list",
  "comic-playground",
  "comment",
  "component",
  "compress",
  "configuration",
  "contract",
  "controller",
  "data",
  "decision",
  "decoder",
  "editor",
  "endpoint",
  "error",
  "export",
  "first-registration",
  "fixture",
  "generated",
  "hash",
  "hook",
  "hover-select",
  "http",
  "identity",
  "image",
  "import",
  "invitation",
  "issue",
  "login",
  "mail",
  "member",
  "member-invitation",
  "member-list",
  "migration",
  "navigation",
  "notification-toast",
  "onboarding",
  "online",
  "page",
  "page-artwork",
  "page-statistic",
  "paginator",
  "persistence",
  "plan",
  "preference",
  "progress",
  "registration",
  "remote",
  "request",
  "resource",
  "response",
  "review",
  "reviewer",
  "route",
  "route-migration",
  "runtime",
  "search-transform",
  "session",
  "setting",
  "shared",
  "shortcut",
  "spec",
  "special-character",
  "status",
  "system-mail",
  "team",
  "term",
  "termbase",
  "terminology",
  "test",
  "test-resource",
  "test-image",
  "toolbox-dropdown",
  "transfer",
  "translator",
  "transport",
  "unit",
  "unicode",
  "unit-list",
  "upload",
  "user",
  "utility",
  "validation",
  "workset",
  "workspace",
]);
const ROUTE_SEGMENT = new Set(["_authenticated", "_shell", "$chapterId", "$pageId"]);
const PAGE_DIRECTORY = new Set([
  "src/route/_authenticated/_shell/settings",
  "src/route/_authenticated/_shell/utilities",
]);
const GENERATED_FIXTURE = new Set(["test-resource/generated", "src/test-resource/generated"]);
const SOURCE_ROOT = new Set(["application", "api", "route", "shared", "test-resource"]);

export function inspectDirectory(path: string): Finding[] {
  const name = path.split("/").at(-1) ?? "";
  const report = (rule: string, message: string): Finding[] => [
    { file: path, line: 1, rule, message },
  ];
  if (path.startsWith("src/") && path.split("/").length === 2 && !SOURCE_ROOT.has(name)) {
    return report("structure.root", `unregistered source root: ${name}`);
  }
  if (path.startsWith("src/route/") && ROUTE_SEGMENT.has(name)) return [];
  if (PAGE_DIRECTORY.has(path)) return [];
  const word =
    path.startsWith("src/route/") && /^\([a-z-]+\)$/u.test(name) ? name.slice(1, -1) : name;
  if (!OWNED_NAME.has(word)) {
    return report(
      "naming.directory",
      `directory ${name} must use a reviewed singular, complete word; register new vocabulary explicitly`,
    );
  }
  return [];
}

export function checkDirectories(root: string): Finding[] {
  const findings: Finding[] = [];
  for (const base of ["src", "script", ".storybook", "docs", "public", "test-resource"]) {
    if (!existsSync(join(root, base))) continue;
    const pending = [base];
    while (pending.length > 0) {
      const parent = pending.pop();
      if (!parent || GENERATED_FIXTURE.has(parent)) continue;
      for (const entry of readdirSync(join(root, parent), { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const path = `${parent}/${entry.name}`;
        findings.push(...inspectDirectory(path));
        pending.push(path);
      }
    }
  }
  return findings;
}
