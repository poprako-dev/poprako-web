import ts from "typescript";
import { inspectApiBoundary } from "./check-api-boundary.ts";

export type Finding = { file: string; line: number; rule: string; message: string };

const OLD_ROOTS = new Set([
  "pages",
  "layouts",
  "router",
  "types",
  "store",
  "hook",
  "hooks",
  "components",
  "lib",
  "utils",
  "config",
  "stories",
]);
const SPECIAL_ROUTE_NAMES = new Set(["_authenticated", "_shell", "$chapterId", "$pageId"]);
const DEFAULT_EXPORT_FILES = new Set([
  ".storybook/main.ts",
  ".storybook/preview.ts",
  "vite.config.ts",
  "vitest.unit.config.ts",
  "vitest.integration.config.ts",
  "vitest.storybook.config.ts",
  "storybook.vite.config.ts",
]);

function isSource(path: string): boolean {
  return /\.(?:ts|tsx)$/u.test(path) && !path.endsWith(".d.ts");
}

function sourceFiles(root: string): string[] {
  const files: string[] = [];
  for (const directory of ["src", "script", "linters", ".storybook"]) {
    const pending = [`${root}/${directory}`];
    while (pending.length > 0) {
      const current = pending.pop();
      if (!current) continue;
      for (const entry of Deno.readDirSync(current)) {
        const path = `${current}/${entry.name}`;
        if (entry.isDirectory) {
          if (entry.name === "node_modules" || entry.name === "dist") continue;
          pending.push(path);
        } else if (isSource(path)) files.push(path);
      }
    }
  }
  for (const entry of Deno.readDirSync(root)) {
    if (entry.isFile && entry.name.endsWith(".config.ts")) files.push(`${root}/${entry.name}`);
  }
  return files.sort();
}

function lineAt(source: ts.SourceFile, position: number): number {
  return source.getLineAndCharacterOfPosition(position).line + 1;
}

function normalized(path: string, root: string): string {
  return path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path;
}

function isPureCallInterface(node: ts.InterfaceDeclaration): boolean {
  return (
    node.members.length > 0 &&
    node.members.every(
      (member) =>
        ts.isCallSignatureDeclaration(member) ||
        ts.isConstructSignatureDeclaration(member) ||
        ts.isMethodSignature(member) ||
        (ts.isPropertySignature(member) &&
          member.type !== undefined &&
          ts.isFunctionTypeNode(member.type)),
    )
  );
}

function isPureCallMembers(members: ts.NodeArray<ts.TypeElement>): boolean {
  return (
    members.length > 0 &&
    members.every(
      (member) =>
        ts.isCallSignatureDeclaration(member) ||
        ts.isConstructSignatureDeclaration(member) ||
        ts.isMethodSignature(member) ||
        (ts.isPropertySignature(member) &&
          member.type !== undefined &&
          ts.isFunctionTypeNode(member.type)),
    )
  );
}

function isRegisteredAmbientInterface(file: string, node: ts.InterfaceDeclaration): boolean {
  if (file !== "src/application/router.ts" || node.name.text !== "Register") return false;
  const block = node.parent;
  const declaration = block.parent;
  return (
    ts.isModuleBlock(block) &&
    ts.isModuleDeclaration(declaration) &&
    ts.isStringLiteral(declaration.name) &&
    declaration.name.text === "@tanstack/react-router"
  );
}

type StyleContext = {
  file: string;
  content: string;
  source: ts.SourceFile;
  findings: Finding[];
};

export function inspectStyleFile(file: string, content: string): Finding[] {
  const normalizedFile = file.replaceAll("\\", "/");
  const source = ts.createSourceFile(
    normalizedFile,
    content,
    ts.ScriptTarget.Latest,
    true,
    normalizedFile.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const context: StyleContext = { file: normalizedFile, content, source, findings: [] };
  if (normalizedFile === "src/route-tree.gen.ts") return context.findings;
  inspectRouteExports(context);
  inspectDirectoryNames(context);
  inspectFileName(context);
  inspectFileSize(context);
  inspectTopLevelDeclarations(context, allowsDefaultExport(context));
  return context.findings;
}

function reportStyle(context: StyleContext, position: number, rule: string, message: string): void {
  context.findings.push({
    file: context.file,
    line: lineAt(context.source, position),
    rule,
    message,
  });
}

function inspectRouteExports(context: StyleContext): void {
  const segments = context.file.split("/");
  if (
    !context.file.startsWith("src/route/") ||
    segments.includes("business") ||
    !context.content.includes("createFileRoute(")
  )
    return;
  for (const statement of context.source.statements) {
    if (isAllowedRouteExport(statement) || !isExported(statement)) continue;
    reportStyle(
      context,
      statement.getStart(context.source),
      "route.lazy-export",
      "route entry modules export only Route; exporting page components prevents automatic lazy splitting",
    );
  }
}

function isAllowedRouteExport(statement: ts.Statement): boolean {
  const routeDeclaration =
    ts.isVariableStatement(statement) &&
    statement.declarationList.declarations.every(
      (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === "Route",
    );
  return (
    routeDeclaration ||
    ts.isTypeAliasDeclaration(statement) ||
    ts.isInterfaceDeclaration(statement) ||
    (ts.isExportDeclaration(statement) && statement.isTypeOnly)
  );
}

function isExported(statement: ts.Statement): boolean {
  return (
    (ts.canHaveModifiers(statement) &&
      Boolean(
        ts
          .getModifiers(statement)
          ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
      )) ||
    ts.isExportDeclaration(statement)
  );
}

function inspectDirectoryNames(context: StyleContext): void {
  const segments = context.file.split("/");
  if (segments.includes("features")) {
    reportStyle(
      context,
      0,
      "structure.features",
      "implementation directories cannot use `features`",
    );
  }
  if (segments.includes("entities")) {
    reportStyle(
      context,
      0,
      "structure.entities",
      "implementation directories cannot use `entities`",
    );
  }
  if (segments[0] === "src" && OLD_ROOTS.has(segments[1] ?? "")) {
    reportStyle(
      context,
      0,
      "structure.root",
      `legacy top-level directory \`${segments[1] ?? "<unknown>"}\` is forbidden`,
    );
  }
  for (const segment of segments.slice(1, -1)) inspectDirectorySegment(context, segment);
}

function inspectDirectorySegment(context: StyleContext, segment: string): void {
  if (
    SPECIAL_ROUTE_NAMES.has(segment) ||
    segment === "business" ||
    segment === "shared" ||
    (context.file.startsWith("src/route/") && /^\([a-z-]+\)$/u.test(segment))
  )
    return;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(segment)) {
    reportStyle(
      context,
      0,
      "naming.directory",
      `directory \`${segment}\` must use lowercase kebab-case`,
    );
  }
}

function inspectFileName(context: StyleContext): void {
  const fileName = context.file.split("/").at(-1) ?? "";
  const baseName = fileName
    .replace(/\.(?:test|spec|stories)\.(?:tsx?|jsx?)$/u, "")
    .replace(/\.[^.]+$/u, "");
  const isTsx = fileName.endsWith(".tsx");
  const frameworkRoot = context.file === "src/route/__root.ts";
  const validBase =
    frameworkRoot ||
    (isTsx ? /^[A-Z][A-Za-z0-9]*$/u.test(baseName) : /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(baseName));
  const isConfig =
    /(?:^|\.)(?:config|setup|shim|type)$/u.test(baseName) || fileName.endsWith(".d.ts");
  if (!validBase && !(isConfig && !isTsx)) {
    reportStyle(
      context,
      0,
      "naming.file",
      `file \`${fileName}\` does not follow its TS/TSX filename convention`,
    );
  }
}

function inspectFileSize(context: StyleContext): void {
  const lineCount = context.content.endsWith("\n")
    ? context.content.split("\n").length - 1
    : context.content.split("\n").length;
  if (lineCount > 400) {
    reportStyle(
      context,
      0,
      "size.lines",
      `${String(lineCount)} physical lines exceed the 400-line limit`,
    );
  }
}

function allowsDefaultExport(context: StyleContext): boolean {
  const relativeFile = context.file.replace(/^.*?(?=(?:src|script)\/)/u, "");
  const fileName = context.file.split("/").at(-1) ?? "";
  return (
    DEFAULT_EXPORT_FILES.has(relativeFile) ||
    fileName.endsWith(".stories.tsx") ||
    fileName.endsWith(".stories.ts")
  );
}

function inspectTopLevelDeclarations(context: StyleContext, allowDefault: boolean): void {
  for (const statement of context.source.statements) {
    inspectTopLevelStatement(context, statement, allowDefault);
    inspectTypeTree(context, statement, allowDefault);
  }
}

function inspectTopLevelStatement(
  context: StyleContext,
  statement: ts.Statement,
  allowDefault: boolean,
): void {
  if (
    ts.canHaveModifiers(statement) &&
    ts
      .getModifiers(statement)
      ?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword) &&
    !allowDefault
  ) {
    reportStyle(
      context,
      statement.getStart(context.source),
      "export.default",
      "default exports require a registered tool exception",
    );
  }
  if (!ts.isVariableStatement(statement)) return;
  for (const declaration of statement.declarationList.declarations) {
    if (isFunctionVariable(declaration)) {
      reportStyle(
        context,
        declaration.getStart(context.source),
        "function.named",
        "top-level functions must use a named function declaration",
      );
    }
  }
}

function isFunctionVariable(declaration: ts.VariableDeclaration): boolean {
  return Boolean(
    declaration.initializer &&
      (ts.isArrowFunction(declaration.initializer) ||
        ts.isFunctionExpression(declaration.initializer)),
  );
}

function inspectTypeTree(context: StyleContext, node: ts.Node, allowDefault: boolean): void {
  inspectTypeRules(context, node, allowDefault);
  ts.forEachChild(node, (child) => {
    inspectTypeTree(context, child, allowDefault);
  });
}

function inspectTypeRules(context: StyleContext, node: ts.Node, allowDefault: boolean): void {
  if (ts.isExportAssignment(node) && !node.isExportEquals && !allowDefault) {
    reportStyle(
      context,
      node.getStart(context.source),
      "export.default",
      "default exports require a registered tool exception",
    );
  }
  if (ts.isInterfaceDeclaration(node)) inspectInterface(context, node);
  if (ts.isTypeAliasDeclaration(node)) inspectTypeAlias(context, node);
}

function inspectInterface(context: StyleContext, node: ts.InterfaceDeclaration): void {
  if (
    node.name.text.endsWith("Props") ||
    (!isPureCallInterface(node) && !isRegisteredAmbientInterface(context.file, node))
  ) {
    reportStyle(
      context,
      node.getStart(context.source),
      "type.interface-data",
      "interfaces are reserved for pure call contracts; use a type for data properties",
    );
  }
}

function inspectTypeAlias(context: StyleContext, node: ts.TypeAliasDeclaration): void {
  if (
    ts.isTypeLiteralNode(node.type) &&
    isPureCallMembers(node.type.members) &&
    !node.name.text.endsWith("Props")
  ) {
    reportStyle(
      context,
      node.getStart(context.source),
      "type.interface-call",
      "pure call contracts should use an interface",
    );
  }
}

export function checkStyle(root: string): Finding[] {
  const findings: Finding[] = [];
  for (const file of sourceFiles(root)) {
    const path = normalized(file, root);
    const content = Deno.readTextFileSync(file);
    findings.push(...inspectStyleFile(path, content), ...inspectApiBoundary(path, content));
  }
  return findings;
}
