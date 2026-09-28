import ts from "typescript";

export type Finding = { file: string; line: number; rule: string; message: string };

const OLD_ROOTS = new Set([
  "pages",
  "layouts",
  "router",
  "api",
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
  for (const directory of ["src", "script", ".storybook"]) {
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

export function inspectStyleFile(file: string, content: string): Finding[] {
  const normalizedFile = file.replaceAll("\\", "/");
  const source = ts.createSourceFile(
    normalizedFile,
    content,
    ts.ScriptTarget.Latest,
    true,
    normalizedFile.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const findings: Finding[] = [];
  const report = (position: number, rule: string, message: string): void => {
    findings.push({ file: normalizedFile, line: lineAt(source, position), rule, message });
  };
  const segments = normalizedFile.split("/");
  const generated = normalizedFile === "src/route-tree.gen.ts";
  if (generated) return findings;
  if (segments.includes("features")) {
    report(0, "structure.features", "implementation directories cannot use `features`");
  }
  if (segments.includes("entities")) {
    report(0, "structure.entities", "implementation directories cannot use `entities`");
  }
  if (segments[0] === "src" && OLD_ROOTS.has(segments[1] ?? "")) {
    report(
      0,
      "structure.root",
      `legacy top-level directory \`${segments[1] ?? "<unknown>"}\` is forbidden`,
    );
  }
  for (const segment of segments.slice(1, -1)) {
    if (SPECIAL_ROUTE_NAMES.has(segment) || segment === "business" || segment === "shared") {
      continue;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(segment)) {
      report(0, "naming.directory", `directory \`${segment}\` must use lowercase kebab-case`);
    }
  }
  const fileName = segments.at(-1) ?? "";
  const baseName = fileName
    .replace(/\.(?:test|stories)\.(?:tsx?|jsx?)$/u, "")
    .replace(/\.[^.]+$/u, "");
  const isTsx = fileName.endsWith(".tsx");
  const routeFile =
    normalizedFile.startsWith("src/routes/") &&
    ["index.tsx", "route.tsx", "__root.tsx", "route-tree.gen.ts"].includes(fileName);
  const kebabBase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(baseName);
  const pascalBase = /^[A-Z][A-Za-z0-9]*$/u.test(baseName);
  const testFile = /\.test\.(?:ts|tsx)$/u.test(fileName);
  const validBase =
    routeFile ||
    (isTsx ? pascalBase || (testFile && kebabBase) : kebabBase || (testFile && pascalBase));
  const isConfig =
    /(?:^|\.)(?:config|setup|shim|type)$/u.test(baseName) || fileName.endsWith(".d.ts");
  if (!validBase && !isConfig && !fileName.endsWith(".d.ts")) {
    report(0, "naming.file", `file \`${fileName}\` does not follow its TS/TSX filename convention`);
  }
  const lineCount = content.endsWith("\n")
    ? content.split("\n").length - 1
    : content.split("\n").length;
  if (lineCount > 400) {
    report(0, "size.lines", `${String(lineCount)} physical lines exceed the 400-line limit`);
  }

  const relativeFile = normalizedFile.replace(/^.*?(?=(?:src|script)\/)/u, "");
  const allowDefault =
    DEFAULT_EXPORT_FILES.has(relativeFile) ||
    fileName.endsWith(".stories.tsx") ||
    fileName.endsWith(".stories.ts");
  const visit = (node: ts.Node): void => {
    if (ts.isExportAssignment(node) && !node.isExportEquals && !allowDefault) {
      report(
        node.getStart(source),
        "export.default",
        "default exports require a registered tool exception",
      );
    }
    if (
      ts.isInterfaceDeclaration(node) &&
      (node.name.text.endsWith("Props") ||
        (!isPureCallInterface(node) && !isRegisteredAmbientInterface(normalizedFile, node)))
    ) {
      report(
        node.getStart(source),
        "type.interface-data",
        "interfaces are reserved for pure call contracts; use a type for data properties",
      );
    }
    if (
      ts.isTypeAliasDeclaration(node) &&
      ts.isTypeLiteralNode(node.type) &&
      isPureCallMembers(node.type.members) &&
      !node.name.text.endsWith("Props")
    ) {
      report(
        node.getStart(source),
        "type.interface-call",
        "pure call contracts should use an interface",
      );
    }
    ts.forEachChild(node, visit);
  };
  for (const statement of source.statements) {
    if (
      ts.canHaveModifiers(statement) &&
      ts
        .getModifiers(statement)
        ?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword) &&
      !allowDefault
    ) {
      report(
        statement.getStart(source),
        "export.default",
        "default exports require a registered tool exception",
      );
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          declaration.initializer &&
          (ts.isArrowFunction(declaration.initializer) ||
            ts.isFunctionExpression(declaration.initializer))
        ) {
          report(
            declaration.getStart(source),
            "function.named",
            "top-level functions must use a named function declaration",
          );
        }
      }
    }
    visit(statement);
  }
  return findings;
}

export function checkStyle(root: string): Finding[] {
  const findings: Finding[] = [];
  for (const file of sourceFiles(root)) {
    findings.push(...inspectStyleFile(normalized(file, root), Deno.readTextFileSync(file)));
  }
  return findings;
}
