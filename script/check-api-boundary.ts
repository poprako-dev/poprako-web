import ts from "typescript";
import type { Finding } from "./check-style.ts";

const ASSET_NETWORK = new Set(["src/shared/utility/compress/archive-worker.ts"]);
const NETWORK_NAME = new Set(["fetch", "XMLHttpRequest", "WebSocket", "EventSource"]);
const NETWORK_GLOBAL = new Set(["window", "globalThis", "self"]);

function plainName(node: ts.Node): string | undefined {
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) return node.text;
  return undefined;
}

function camelKey(key: string): string {
  return key.replace(/_+([a-zA-Z0-9])/gu, (_, letter: string) => letter.toUpperCase());
}

export function inspectApiBoundary(file: string, content: string): Finding[] {
  if (
    !file.startsWith("src/") ||
    /\.(?:test|stories)\.[jt]sx?$/u.test(file) ||
    file.includes("/test/") ||
    file.startsWith("src/test-resource/") ||
    file === "src/route-tree.gen.ts"
  )
    return [];
  const source = ts.createSourceFile(
    file,
    content,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const findings: Finding[] = [];
  const report = (node: ts.Node, rule: string, message: string): void => {
    findings.push({
      file,
      line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
      rule,
      message,
    });
  };
  const visit = (node: ts.Node): void => {
    if (
      file.startsWith("src/api/") &&
      ts.isImportDeclaration(node) &&
      ts.isStringLiteralLike(node.moduleSpecifier) &&
      /^(?:react(?:-dom)?(?:\/|$)|zustand(?:\/|$)|@tanstack\/react-router(?:\/|$))/u.test(
        node.moduleSpecifier.text,
      )
    ) {
      report(node, "api.dependency", "API must not import React, application state or routing");
    }
    if (
      !file.startsWith("src/api/") &&
      !ASSET_NETWORK.has(file) &&
      (ts.isCallExpression(node) || ts.isNewExpression(node))
    ) {
      const expression = node.expression;
      const network = ts.isIdentifier(expression)
        ? NETWORK_NAME.has(expression.text)
        : ts.isPropertyAccessExpression(expression) &&
          ts.isIdentifier(expression.expression) &&
          NETWORK_GLOBAL.has(expression.expression.text) &&
          NETWORK_NAME.has(expression.name.text);
      if (network) report(node, "api.transport", "business network access belongs in src/api");
    }
    if (ts.isPropertyAssignment(node)) {
      const destination = plainName(node.name);
      const value = node.initializer;
      const sourceName = ts.isPropertyAccessExpression(value)
        ? value.name.text
        : ts.isElementAccessExpression(value)
          ? plainName(value.argumentExpression)
          : undefined;
      if (
        destination &&
        sourceName &&
        destination !== sourceName &&
        ((sourceName.includes("_") && camelKey(sourceName) === destination) ||
          (destination.includes("_") && camelKey(destination) === sourceName))
      ) {
        report(
          node,
          "api.manual-case-conversion",
          "use centralized toCamelCase/toSnakeCase instead of copying fields to change naming",
        );
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return findings;
}
