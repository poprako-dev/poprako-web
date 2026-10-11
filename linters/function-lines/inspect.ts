import ts from "typescript";
import {
  functionName,
  isComponentFunction,
  isExecutableFunction,
  nodeLines,
  ownReturns,
  returnLineCount,
} from "./function-node.ts";

export type FunctionLineFinding = {
  file: string;
  line: number;
  column: number;
  functionName: string;
  rule: "function.lines" | "component.return-lines";
  actual: number;
  limit: number;
};

function scriptKind(file: string): ts.ScriptKind {
  if (file.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (file.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (/\.[cm]?js$/u.test(file)) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function inspectFunction(
  node: ts.FunctionLikeDeclaration,
  source: ts.SourceFile,
): FunctionLineFinding[] {
  if (!node.body) return [];

  const range = nodeLines(node, source);
  const returns = ownReturns(node.body);
  const component = isComponentFunction(node, source, returns);
  const renderLines = component ? returnLineCount(returns, source) : 0;
  const logicLines = range.end - range.start + 1 - renderLines;
  const position = source.getLineAndCharacterOfPosition(node.getStart(source));
  const base = {
    file: source.fileName,
    line: range.start,
    column: position.character + 1,
    functionName: functionName(node, source),
  };
  const findings: FunctionLineFinding[] = [];

  if (logicLines > 50) {
    findings.push({ ...base, rule: "function.lines", actual: logicLines, limit: 50 });
  }
  if (renderLines > 150) {
    findings.push({ ...base, rule: "component.return-lines", actual: renderLines, limit: 150 });
  }

  return findings;
}

export function inspectFunctionLines(file: string, content: string): FunctionLineFinding[] {
  const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, scriptKind(file));
  const findings: FunctionLineFinding[] = [];

  function visit(node: ts.Node): void {
    if (isExecutableFunction(node)) findings.push(...inspectFunction(node, source));
    ts.forEachChild(node, visit);
  }

  visit(source);
  return findings;
}
