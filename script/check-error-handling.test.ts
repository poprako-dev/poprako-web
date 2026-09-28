import fs from "node:fs";
import path from "node:path";
import { deepStrictEqual } from "node:assert/strict";
import ts from "typescript";

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(filePath);
    }
    if (!/\.tsx?$/.test(entry.name) || /\.(test|stories)\.tsx?$/.test(entry.name)) {
      return [];
    }
    return [filePath];
  });
}

function isFailedResultCheck(node: ts.Expression): boolean {
  return (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.ExclamationToken &&
    ts.isPropertyAccessExpression(node.operand) &&
    node.operand.name.text === "success"
  );
}

function isHardcodedErrorToast(node: ts.Node): boolean {
  if (!ts.isCallExpression(node) || node.arguments.length < 2) {
    return false;
  }
  const callee = node.expression;
  const isShowToast = ts.isIdentifier(callee)
    ? callee.text === "showToast"
    : ts.isPropertyAccessExpression(callee) && callee.name.text === "showToast";
  if (!isShowToast) {
    return false;
  }

  const [message, type] = node.arguments;
  if (!message || !type) {
    return false;
  }
  return (
    (ts.isStringLiteral(message) || ts.isNoSubstitutionTemplateLiteral(message)) &&
    ts.isStringLiteral(type) &&
    type.text === "error"
  );
}

function isDroppedResultMetadata(node: ts.Node): boolean {
  if (!ts.isThrowStatement(node)) {
    return false;
  }
  if (!ts.isNewExpression(node.expression)) {
    return false;
  }
  if (!ts.isIdentifier(node.expression.expression)) {
    return false;
  }
  if (node.expression.expression.text !== "Error") {
    return false;
  }
  const argument = node.expression.arguments?.[0];
  if (!argument) {
    return false;
  }
  return (
    Boolean(argument) && ts.isPropertyAccessExpression(argument) && argument.name.text === "error"
  );
}

Deno.test(
  "API error handling guard reports no hardcoded failed Result toasts or dropped metadata",
  () => {
    const violations: string[] = [];

    for (const filePath of sourceFiles("src")) {
      const source = ts.createSourceFile(
        filePath,
        fs.readFileSync(filePath, "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );

      const visit = (node: ts.Node): void => {
        if (ts.isIfStatement(node) && isFailedResultCheck(node.expression)) {
          const inspectFailureBranch = (child: ts.Node): void => {
            if (isHardcodedErrorToast(child)) {
              const line = source.getLineAndCharacterOfPosition(child.getStart()).line + 1;
              violations.push(`${filePath}:${String(line)}: hardcoded failed Result toast`);
            }
            ts.forEachChild(child, inspectFailureBranch);
          };
          inspectFailureBranch(node.thenStatement);
        }

        if (isDroppedResultMetadata(node)) {
          const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          violations.push(`${filePath}:${String(line)}: use toApiRequestError`);
        }
        ts.forEachChild(node, visit);
      };

      visit(source);
    }

    deepStrictEqual(violations, []);
  },
);
