import { isAbsolute, join, relative, resolve } from "node:path";
import ts from "typescript";
import type { ModuleEdge } from "./check-cycle.ts";

export type SourceEntry = { path: string; content: string };
type EdgeContext = {
  entry: SourceEntry;
  root: string;
  options: ts.CompilerOptions;
  file: string;
  source: ts.SourceFile;
  edges: ModuleEdge[];
};

export function sourceFiles(root: string): string[] {
  const files: string[] = [];
  for (const directory of ["src", "script", "linters", ".storybook"]) {
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
  const path = relative(root, result).replaceAll("\\", "/");
  return path === ".." || path.startsWith("../") || isAbsolute(path) ? undefined : path;
}

export function isTestPath(path: string): boolean {
  return /(?:\.test\.[jt]sx?|\.stories\.[jt]sx?|\/business\/(?:[^/]+\/)*test\/|\/application\/test\/)/u.test(
    path,
  );
}

export function isIntegrationTest(path: string): boolean {
  return (
    path.startsWith("src/application/test/") ||
    /\/business\/(?:[^/]+\/)*test\/.*\.(?:test|stories)\.[jt]sx?$/u.test(path)
  );
}

export function isRoute(path: string): boolean {
  return path.startsWith("src/route/") && !path.endsWith("route-tree.gen.ts");
}

export function collectEdges(entries: SourceEntry[], root: string): ModuleEdge[] {
  const options = compilerOptions(root);
  return entries.flatMap((entry) => collectEntryEdges(entry, root, options));
}

function collectEntryEdges(
  entry: SourceEntry,
  root: string,
  options: ts.CompilerOptions,
): ModuleEdge[] {
  const file = resolve(root, entry.path);
  const source = ts.createSourceFile(
    file,
    entry.content,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const context: EdgeContext = { entry, root, options, file, source, edges: [] };
  collectStaticEdges(context);
  visitDynamicEdges(source, context);
  collectInlineScriptEdges(context);
  return context.edges;
}

function collectStaticEdges(context: EdgeContext): void {
  for (const node of context.source.statements) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      const clause = ts.isImportDeclaration(node) ? node.importClause : undefined;
      recordEdge(
        context,
        node.moduleSpecifier.text,
        node.getStart(context.source),
        "module declaration",
        {
          defaultImport: Boolean(clause?.name),
          typeOnly: isTypeOnlyDeclaration(node),
        },
      );
    }
  }
}

function isTypeOnlyDeclaration(node: ts.ImportDeclaration | ts.ExportDeclaration): boolean {
  if (ts.isExportDeclaration(node)) return node.isTypeOnly;
  const clause = node.importClause;
  return (
    clause?.phaseModifier === ts.SyntaxKind.TypeKeyword ||
    Boolean(
      clause?.namedBindings &&
        ts.isNamedImports(clause.namedBindings) &&
        !clause.name &&
        clause.namedBindings.elements.every((element) => element.isTypeOnly),
    )
  );
}

type EdgeOptions = {
  defaultImport?: boolean;
  sourceFile?: ts.SourceFile;
  lineOffset?: number;
  typeOnly?: boolean;
};

function recordEdge(
  context: EdgeContext,
  specifier: string,
  position: number,
  clause: string,
  edgeOptions: EdgeOptions = {},
): void {
  const target = resolveEdgeTarget(context, specifier, clause);
  if (!target) return;
  const source = edgeOptions.sourceFile ?? context.source;
  context.edges.push({
    from: context.entry.path,
    to: target,
    line: (edgeOptions.lineOffset ?? 0) + source.getLineAndCharacterOfPosition(position).line + 1,
    clause,
    defaultImport: edgeOptions.defaultImport,
    typeOnly: edgeOptions.typeOnly,
  });
}

function resolveEdgeTarget(
  context: EdgeContext,
  specifier: string,
  clause: string,
): string | undefined {
  return (
    resolvedPath(specifier, context.entry.path, context.root, context.options) ??
    (/^(?:\.|@\/|\/src\/)/u.test(specifier) &&
    (clause !== "new URL asset reference" || /\.(?:[cm]?[jt]sx?)$/u.test(specifier)) &&
    !/\.(?:css|json|png|jpe?g|avif|svg|bin|wasm)(?:\?.*)?$/iu.test(specifier)
      ? `@unresolved:${specifier}`
      : undefined)
  );
}

function visitDynamicEdges(source: ts.SourceFile, context: EdgeContext): void {
  const visit = (node: ts.Node): void => {
    inspectDynamicNode(node, context);
    ts.forEachChild(node, visit);
  };
  visit(source);
}

function inspectDynamicNode(node: ts.Node, context: EdgeContext): void {
  if (ts.isCallExpression(node) && isDynamicImport(node)) inspectDynamicCall(node, context);
  if (ts.isNewExpression(node) && isUrlExpression(node)) inspectUrlExpression(node, context);
  if (ts.isNewExpression(node) && isWorkerExpression(node)) inspectWorkerExpression(node, context);
}

function isDynamicImport(node: ts.CallExpression): boolean {
  return (
    node.expression.kind === ts.SyntaxKind.ImportKeyword ||
    (ts.isIdentifier(node.expression) && node.expression.text === "require")
  );
}

function inspectDynamicCall(node: ts.CallExpression, context: EdgeContext): void {
  const argument = node.arguments[0];
  if (argument && ts.isStringLiteralLike(argument)) {
    recordEdge(context, argument.text, node.getStart(context.source), "dynamic import or require");
  } else {
    recordDynamicEdge(context, node, "non-literal dynamic import or require");
  }
}

function isUrlExpression(node: ts.NewExpression): boolean {
  return (
    ts.isIdentifier(node.expression) &&
    node.expression.text === "URL" &&
    node.arguments?.length === 2
  );
}

function inspectUrlExpression(node: ts.NewExpression, context: EdgeContext): void {
  const asset = node.arguments?.[0];
  if (asset && ts.isStringLiteralLike(asset)) {
    recordEdge(context, asset.text, node.getStart(context.source), "new URL asset reference");
  } else if (node.arguments?.[1]?.getText(context.source) === "import.meta.url") {
    recordDynamicEdge(context, node, "non-literal Worker or asset URL");
  }
}

function isWorkerExpression(node: ts.NewExpression): boolean {
  return ts.isIdentifier(node.expression) && node.expression.text === "Worker";
}

function inspectWorkerExpression(node: ts.NewExpression, context: EdgeContext): void {
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
    recordDynamicEdge(context, node, "non-literal Worker URL");
  }
}

function recordDynamicEdge(context: EdgeContext, node: ts.Node, clause: string): void {
  context.edges.push({
    from: context.entry.path,
    to: "@dynamic",
    line: context.source.getLineAndCharacterOfPosition(node.getStart(context.source)).line + 1,
    clause,
  });
}

function collectInlineScriptEdges(context: EdgeContext): void {
  const inlineScripts = /<script\b[^>]*>([\s\S]*?)<\/script>/giu;
  for (const match of context.entry.content.matchAll(inlineScripts)) {
    const body = match[1];
    if (body !== undefined) collectInlineScript(context, body, match.index);
  }
}

function collectInlineScript(context: EdgeContext, body: string, index: number): void {
  const inline = ts.createSourceFile(
    context.file,
    body,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const lineOffset = context.source.getLineAndCharacterOfPosition(index).line;
  for (const node of inline.statements) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
      recordEdge(
        context,
        node.moduleSpecifier.text,
        node.getStart(inline),
        "generated HTML module import",
        {
          defaultImport: Boolean(node.importClause?.name),
          sourceFile: inline,
          lineOffset,
        },
      );
    }
  }
}
