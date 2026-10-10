import ts from "typescript";

export function isExecutableFunction(node: ts.Node): node is ts.FunctionLikeDeclaration {
  return (
    (ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isConstructorDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node)) &&
    node.body !== undefined
  );
}

export function functionName(node: ts.FunctionLikeDeclaration, source: ts.SourceFile): string {
  if (ts.isConstructorDeclaration(node)) return "constructor";
  if (node.name) return node.name.getText(source);

  const parent = node.parent;
  if (ts.isVariableDeclaration(parent) || ts.isPropertyAssignment(parent)) {
    return parent.name.getText(source);
  }

  return "<anonymous>";
}

function containsJsx(node: ts.Node, skipFunctions: boolean): boolean {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
    return true;
  }
  if (skipFunctions && ts.isFunctionLike(node)) return false;

  let found = false;
  ts.forEachChild(node, (child) => {
    if (!found) found = containsJsx(child, skipFunctions);
  });

  return found;
}

export function ownReturns(body: ts.ConciseBody): ts.Node[] {
  if (!ts.isBlock(body)) return [body];

  const returns: ts.ReturnStatement[] = [];
  function visit(node: ts.Node): void {
    if (ts.isFunctionLike(node)) return;
    if (ts.isReturnStatement(node)) returns.push(node);
    ts.forEachChild(node, visit);
  }

  visit(body);
  return returns;
}

export function isComponentFunction(
  node: ts.FunctionLikeDeclaration,
  source: ts.SourceFile,
  returns: readonly ts.Node[],
): boolean {
  if (!/\.[jt]sx$/u.test(source.fileName) || !/^[A-Z]/u.test(functionName(node, source))) {
    return false;
  }

  return (
    (node.body !== undefined && containsJsx(node.body, true)) ||
    returns.some((statement) => containsJsx(statement, false))
  );
}

export function nodeLines(node: ts.Node, source: ts.SourceFile): { start: number; end: number } {
  return {
    start: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
    end: source.getLineAndCharacterOfPosition(node.end - 1).line + 1,
  };
}

export function returnLineCount(returns: readonly ts.Node[], source: ts.SourceFile): number {
  const lines = new Set<number>();
  for (const statement of returns) {
    const range = nodeLines(statement, source);
    for (let line = range.start; line <= range.end; line++) lines.add(line);
  }

  return lines.size;
}
