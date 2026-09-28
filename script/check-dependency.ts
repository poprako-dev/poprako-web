import { join, normalize, relative, resolve } from "node:path";
import ts from "typescript";
import type { Finding } from "./check-style.ts";

type ModuleEdge = {
  from: string;
  to: string;
  line: number;
  clause: string;
  defaultImport?: boolean;
};
type SourceEntry = { path: string; content: string };

function sourceFiles(root: string): string[] {
  const files: string[] = [];
  for (const directory of ["src", "script", ".storybook"]) {
    const pending = [join(root, directory)];
    while (pending.length > 0) {
      const current = pending.pop();
      if (!current) continue;
      for (const entry of Deno.readDirSync(current)) {
        const path = join(current, entry.name);
        if (entry.isDirectory) {
          if (entry.name !== "node_modules" && entry.name !== "dist") pending.push(path);
        } else if (/\.(?:ts|tsx|js|mjs)$/u.test(path) && !path.endsWith(".d.ts")) {
          files.push(path);
        }
      }
    }
  }
  for (const entry of Deno.readDirSync(root)) {
    if (entry.isFile && entry.name.endsWith(".config.ts")) files.push(join(root, entry.name));
  }
  return files.sort();
}

function compilerOptions(root: string): ts.CompilerOptions {
  const configPath = join(root, "tsconfig.base.json");
  const parsed = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic(diagnostic) {
        throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
      },
    },
  );
  if (!parsed) throw new Error(`Could not parse ${configPath}`);
  return parsed.options;
}

function resolvedPath(
  specifier: string,
  from: string,
  root: string,
  options: ts.CompilerOptions,
): string | undefined {
  const absoluteSource = resolve(root, from);
  const moduleSpecifier = specifier.startsWith("/src/")
    ? `@/${specifier.slice("/src/".length)}`
    : specifier;
  const result = ts.resolveModuleName(moduleSpecifier, absoluteSource, options, ts.sys)
    .resolvedModule?.resolvedFileName;
  if (!result) return undefined;
  const path = normalize(result);
  return path.startsWith(`${root}/`) ? path.slice(root.length + 1) : undefined;
}

function sourceDomain(path: string, root: string): string | undefined {
  const segments = path.split("/");
  if (segments[0] !== "src" || segments[1] !== "routes") return undefined;
  const routePath = segments.slice(2);
  if (routePath[0] === "business") return "@common-business";
  if (routePath[0] === "route-tree.gen.ts") return "@generated";
  let directory = routePath.slice(0, -1);
  while (directory.length > 0) {
    const routeDir = `src/routes/${directory.join("/")}`;
    for (const entry of ["route.tsx", "index.tsx"]) {
      try {
        if (Deno.statSync(`${root}/${routeDir}/${entry}`).isFile) return routeDir;
      } catch {
        // Continue toward the nearest parent route boundary.
      }
    }
    directory = directory.slice(0, -1);
  }
  return undefined;
}

function isTestPath(path: string): boolean {
  return /(?:\.test\.[jt]sx?|\.stories\.[jt]sx?|\/business\/(?:[^/]+\/)*test\/|\/application\/test\/)/u.test(
    path,
  );
}

function isIntegrationTest(path: string): boolean {
  return (
    path.startsWith("src/application/test/") ||
    /\/business\/(?:[^/]+\/)*test\/.*\.(?:test|stories)\.[jt]sx?$/u.test(path)
  );
}

function isRoute(path: string): boolean {
  return path.startsWith("src/routes/") && !path.endsWith("route-tree.gen.ts");
}

function routeRelation(
  source: string,
  target: string,
  root: string,
): "same" | "ancestor" | "sibling" | "other" {
  const sourceRoute = sourceDomain(source, root);
  const targetRoute = sourceDomain(target, root);
  if (!sourceRoute || !targetRoute) return "other";
  if (sourceRoute === targetRoute) return "same";
  if (targetRoute === "@common-business") return "ancestor";
  if (sourceRoute.startsWith(`${targetRoute}/`)) return "ancestor";
  return "sibling";
}

function collectEdges(entries: SourceEntry[], root: string): ModuleEdge[] {
  const edges: ModuleEdge[] = [];
  const options = compilerOptions(root);
  for (const entry of entries) {
    const file = resolve(root, entry.path);
    const source = ts.createSourceFile(
      file,
      entry.content,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const record = (
      specifier: string,
      position: number,
      clause: string,
      defaultImport = false,
      sourceFile = source,
      lineOffset = 0,
    ): void => {
      const target =
        resolvedPath(specifier, entry.path, root, options) ??
        (/^(?:\.|@\/|\/src\/)/u.test(specifier) &&
        (clause !== "new URL asset reference" || /\.(?:[cm]?[jt]sx?)$/u.test(specifier)) &&
        !/\.(?:css|json|png|jpe?g|avif|svg|bin|wasm)(?:\?.*)?$/iu.test(specifier)
          ? `@unresolved:${specifier}`
          : undefined);
      if (!target) return;
      edges.push({
        from: entry.path,
        to: target,
        line: lineOffset + sourceFile.getLineAndCharacterOfPosition(position).line + 1,
        clause,
        defaultImport,
      });
    };
    for (const node of source.statements) {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteralLike(node.moduleSpecifier)
      ) {
        const clause = ts.isImportDeclaration(node) ? node.importClause : undefined;
        record(
          node.moduleSpecifier.text,
          node.getStart(source),
          "module declaration",
          Boolean(clause?.name),
        );
      }
    }
    const visit = (node: ts.Node): void => {
      if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) && node.expression.text === "require"))
      ) {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteralLike(argument)) {
          record(argument.text, node.getStart(source), "dynamic import or require");
        } else {
          edges.push({
            from: entry.path,
            to: "@dynamic",
            line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
            clause: "non-literal dynamic import or require",
          });
        }
      }
      if (
        ts.isNewExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "URL" &&
        node.arguments?.length === 2
      ) {
        const [asset] = node.arguments;
        if (asset && ts.isStringLiteralLike(asset)) {
          record(asset.text, node.getStart(source), "new URL asset reference");
        } else if (node.arguments[1]?.getText(source) === "import.meta.url") {
          edges.push({
            from: entry.path,
            to: "@dynamic",
            line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
            clause: "non-literal Worker or asset URL",
          });
        }
      }
      if (
        ts.isNewExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "Worker"
      ) {
        const [workerUrl] = node.arguments ?? [];
        if (
          workerUrl &&
          !ts.isStringLiteralLike(workerUrl) &&
          !(
            ts.isNewExpression(workerUrl) &&
            ts.isIdentifier(workerUrl.expression) &&
            workerUrl.expression.text === "URL"
          )
        ) {
          edges.push({
            from: entry.path,
            to: "@dynamic",
            line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
            clause: "non-literal Worker URL",
          });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);

    const inlineScripts = /<script\b[^>]*>([\s\S]*?)<\/script>/giu;
    for (const match of entry.content.matchAll(inlineScripts)) {
      const body = match[1];
      if (body === undefined) continue;
      const inline = ts.createSourceFile(
        file,
        body,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.JS,
      );
      const lineOffset = source.getLineAndCharacterOfPosition(match.index).line;
      for (const node of inline.statements) {
        if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
          record(
            node.moduleSpecifier.text,
            node.getStart(inline),
            "generated HTML module import",
            Boolean(node.importClause?.name),
            inline,
            lineOffset,
          );
        }
      }
    }
  }
  return edges;
}

export function inspectDependencyEntries(entries: SourceEntry[], root: string): Finding[] {
  const findings: Finding[] = [];
  for (const edge of collectEdges(entries, root)) {
    if (edge.to === "@dynamic") {
      findings.push({
        file: edge.from,
        line: edge.line,
        rule: "dependency.dynamic",
        message: `${edge.from}: ${edge.clause} needs an explicit finite import map`,
      });
      continue;
    }
    if (edge.to.startsWith("@unresolved:")) {
      findings.push({
        file: edge.from,
        line: edge.line,
        rule: "dependency.unresolved",
        message: `${edge.from} → ${edge.to.slice("@unresolved:".length)}: local module target could not be resolved`,
      });
      continue;
    }
    if (
      edge.defaultImport &&
      !edge.to.includes("/node_modules/") &&
      !edge.to.endsWith(".d.ts") &&
      !moduleHasDefaultExport(root, edge.to)
    ) {
      findings.push({
        file: edge.from,
        line: edge.line,
        rule: "dependency.default-import",
        message: `${edge.from} → ${edge.to}: default import has no default export`,
      });
    }
    const sourceTest = isTestPath(edge.from);
    const targetTest = isTestPath(edge.to);
    const report = (clause: string): void => {
      findings.push({
        file: edge.from,
        line: edge.line,
        rule: "dependency.direction",
        message: `${edge.from} → ${edge.to}: ${clause} (${edge.clause})`,
      });
    };
    if (!sourceTest && targetTest) {
      report("production code cannot import tests, stories, or fixtures");
      continue;
    }
    if (
      edge.from.startsWith("src/shared/") &&
      (edge.to.startsWith("src/routes/") || edge.to.startsWith("src/application/"))
    ) {
      report("shared modules cannot depend on routes or application assembly");
      continue;
    }
    if (edge.from.startsWith("src/routes/") && edge.to.startsWith("src/application/")) {
      report("routes cannot depend on application assembly");
      continue;
    }
    if (!isRoute(edge.from) || !isRoute(edge.to)) continue;
    if (sourceTest && isIntegrationTest(edge.from)) continue;
    const sourceRoute = sourceDomain(edge.from, root);
    const targetRoute = sourceDomain(edge.to, root);
    if (
      sourceRoute === "@common-business" &&
      (targetRoute !== "@common-business" ||
        /^src\/routes\/business\/(?:index|route)\.tsx?$/u.test(edge.to))
    ) {
      report("route business modules cannot depend on route implementation modules");
      continue;
    }
    const relation = routeRelation(edge.from, edge.to, root);
    if (relation === "same") continue;
    if (relation === "ancestor" && edge.to.includes("/business/")) continue;
    if (relation === "sibling") {
      report("a route may depend only on its own package or ancestor business modules");
    }
  }
  return findings;
}

function moduleHasDefaultExport(root: string, path: string): boolean {
  try {
    const file = resolve(root, path);
    const source = ts.createSourceFile(
      file,
      Deno.readTextFileSync(file),
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    return source.statements.some((statement) => {
      const hasDefaultModifier =
        ts.canHaveModifiers(statement) &&
        Boolean(
          ts
            .getModifiers(statement)
            ?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword),
        );
      return (
        (ts.isExportAssignment(statement) && !statement.isExportEquals) ||
        hasDefaultModifier ||
        (ts.isExportDeclaration(statement) &&
          statement.exportClause !== undefined &&
          ts.isNamedExports(statement.exportClause) &&
          statement.exportClause.elements.some((element) => element.name.text === "default"))
      );
    });
  } catch {
    return false;
  }
}

export function checkDependencies(root: string): Finding[] {
  const entries = sourceFiles(root).map((absolute) => ({
    path: relative(root, absolute).replaceAll("\\", "/"),
    content: Deno.readTextFileSync(absolute),
  }));
  return inspectDependencyEntries(entries, root);
}
