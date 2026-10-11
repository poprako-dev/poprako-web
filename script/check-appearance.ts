import ts from "typescript";
import type { Finding } from "./check-style.ts";

const DARK_CLASS = /(?:^|\s)(?:dark:|dark(?=\s|$))/u;
const PALETTE_CLASS =
  /(?:^|\s)(?:[\w-]+(?:\/[\w-]+)?\s*:)*(?:bg|text|border|ring|outline|fill|stroke|from|via|to|shadow)-(?:\[(?:#[\da-f]{3,8}|(?:rgb|hsl|oklch|var)\()|(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}(?:\/\d{1,3})?|white|black)(?:\])?(?=\s|$)/iu;
const RAW_PALETTE_REFERENCE =
  /--(?:color-)?(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/iu;
const RAW_CSS_COLOR =
  /#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch|hwb)\(|\b(?:white|black|red|orange|yellow|green|blue|purple|pink|gray|grey|silver|maroon|navy|teal|olive|lime|aqua|fuchsia)\b|--color-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/iu;
const TEST_OR_STORY = /(?:\.test|\.stories)\.tsx?$/u;
const EXCEPTION = /appearance-exempt:\s*(content-color|geometry)\s+--\s+\S/u;
const CLASS_HELPERS = new Set(["clsx", "cn", "cva", "classNames", "twMerge"]);
const COLOR_PROPS = new Set([
  "color",
  "background",
  "backgroundColor",
  "borderColor",
  "outlineColor",
  "fill",
  "stroke",
  "textDecorationColor",
  "accentColor",
  "caretColor",
]);

function lineAt(source: ts.SourceFile, position: number): number {
  return source.getLineAndCharacterOfPosition(position).line + 1;
}

function isExempt(content: string, position: number): boolean {
  const start = Math.max(0, position - 240);
  const context = content.slice(start, position);
  const comment = /(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*)(?:\s*)$/u.exec(context)?.[0] ?? "";
  return EXCEPTION.test(comment);
}

function isProductionSource(path: string): boolean {
  const normalized = path.replaceAll("\\", "/");
  return (
    normalized.startsWith("src/") &&
    /\.tsx?$/u.test(normalized) &&
    !normalized.endsWith(".d.ts") &&
    !TEST_OR_STORY.test(normalized) &&
    !normalized.split("/").includes("test") &&
    !normalized.split("/").includes("tests")
  );
}

function isRawCssColor(value: string): boolean {
  return (
    RAW_PALETTE_REFERENCE.test(value) ||
    RAW_CSS_COLOR.test(value.replace(/var\(\s*--[\w-]+\s*\)/gu, ""))
  );
}

type StringInspector = (value: string, position: number) => void;

function helperName(expression: ts.Expression): string {
  return ts.isIdentifier(expression)
    ? expression.text
    : ts.isPropertyAccessExpression(expression)
      ? expression.name.text
      : "";
}

function inspectExpression(
  expression: ts.Expression,
  source: ts.SourceFile,
  inspectString: StringInspector,
): void {
  if (ts.isStringLiteralLike(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    inspectString(expression.text, expression.getStart(source));
  } else if (ts.isTemplateExpression(expression)) {
    inspectTemplateExpression(expression, source, inspectString);
  } else if (ts.isCallExpression(expression)) {
    if (CLASS_HELPERS.has(helperName(expression.expression))) {
      for (const argument of expression.arguments)
        inspectExpression(argument, source, inspectString);
    }
  } else if (ts.isArrayLiteralExpression(expression)) {
    for (const element of expression.elements) inspectExpression(element, source, inspectString);
  } else if (ts.isObjectLiteralExpression(expression)) {
    inspectObjectExpression(expression, source, inspectString);
  } else if (ts.isConditionalExpression(expression)) {
    inspectExpression(expression.whenTrue, source, inspectString);
    inspectExpression(expression.whenFalse, source, inspectString);
  } else if (ts.isBinaryExpression(expression)) {
    inspectExpression(expression.left, source, inspectString);
    inspectExpression(expression.right, source, inspectString);
  }
}

function inspectTemplateExpression(
  expression: ts.TemplateExpression,
  source: ts.SourceFile,
  inspectString: StringInspector,
): void {
  inspectString(expression.head.text, expression.head.getStart(source));
  for (const span of expression.templateSpans) {
    inspectString(span.literal.text, span.literal.getStart(source));
    inspectExpression(span.expression, source, inspectString);
  }
}

function inspectObjectExpression(
  expression: ts.ObjectLiteralExpression,
  source: ts.SourceFile,
  inspectString: StringInspector,
): void {
  for (const property of expression.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    if (ts.isStringLiteralLike(property.name)) {
      inspectString(property.name.text, property.name.getStart(source));
    }
    inspectExpression(property.initializer, source, inspectString);
  }
}

function inspectTypeScript(path: string, content: string): Finding[] {
  if (!isProductionSource(path)) return [];
  const normalized = path.replaceAll("\\", "/");
  const source = ts.createSourceFile(
    normalized,
    content,
    ts.ScriptTarget.Latest,
    true,
    normalized.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const findings: Finding[] = [];
  const seen = new Set<string>();
  const report = (position: number, rule: string, message: string): void => {
    const key = `${String(position)}:${rule}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({ file: normalized, line: lineAt(source, position), rule, message });
  };
  const inspectClass = (value: string, position: number): void => {
    if (isExempt(content, position)) return;
    if (DARK_CLASS.test(value)) {
      report(position, "appearance.dark-class", "dark-mode utility classes are not supported");
    }
    if (PALETTE_CLASS.test(value) || RAW_PALETTE_REFERENCE.test(value)) {
      report(
        position,
        "appearance.raw-palette",
        "use a semantic color token instead of a palette class or raw palette variable",
      );
    }
  };
  const inspectColor = (value: string, position: number): void => {
    if (isExempt(content, position)) return;
    if (isRawCssColor(value)) {
      report(position, "appearance.raw-color", "use a semantic color token for interface colors");
    }
  };
  visitTypeScript(source, content, inspectClass, inspectColor);
  return findings;
}

function visitTypeScript(
  source: ts.SourceFile,
  content: string,
  inspectClass: StringInspector,
  inspectColor: StringInspector,
): void {
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && CLASS_HELPERS.has(helperName(node.expression))) {
      for (const argument of node.arguments) inspectExpression(argument, source, inspectClass);
    }
    if (ts.isJsxAttribute(node)) inspectJsxAttribute(node, source, inspectClass, inspectColor);
    ts.forEachChild(node, visit);
  };
  visit(source);
}

function inspectJsxAttribute(
  node: ts.JsxAttribute,
  source: ts.SourceFile,
  inspectClass: StringInspector,
  inspectColor: StringInspector,
): void {
  const name = node.name.getText(source);
  const initializer = node.initializer;
  if (!initializer) return;
  if (name === "className" || name === "class") {
    inspectJsxString(initializer, source, inspectClass);
  } else if (COLOR_PROPS.has(name)) {
    inspectJsxString(initializer, source, inspectColor);
  } else if (name === "style") {
    inspectStyleAttribute(initializer, source, inspectColor);
  }
}

function inspectJsxString(
  initializer: ts.JsxAttributeValue,
  source: ts.SourceFile,
  inspectString: StringInspector,
): void {
  if (ts.isStringLiteralLike(initializer)) {
    inspectString(initializer.text, initializer.getStart(source));
  } else if (ts.isJsxExpression(initializer) && initializer.expression) {
    inspectExpression(initializer.expression, source, inspectString);
  }
}

function inspectStyleAttribute(
  initializer: ts.JsxAttributeValue,
  source: ts.SourceFile,
  inspectColor: StringInspector,
): void {
  if (!ts.isJsxExpression(initializer) || !initializer.expression) return;
  const style = initializer.expression;
  if (!ts.isObjectLiteralExpression(style)) return;
  for (const property of style.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) continue;
    if (COLOR_PROPS.has(property.name.text)) {
      inspectExpression(property.initializer, source, inspectColor);
    }
  }
}

function inspectCss(path: string, content: string): Finding[] {
  const normalized = path.replaceAll("\\", "/");
  if (!normalized.startsWith("src/") || !normalized.endsWith(".css")) return [];
  const findings: Finding[] = [];
  const lines = content.split("\n");
  const visibleLines = content
    .replace(/\/\*[\s\S]*?\*\//gu, (comment) => comment.replace(/[^\n]/gu, " "))
    .split("\n");
  let braceDepth = 0;
  let rootDepth: number | null = null;
  for (let index = 0; index < lines.length; index += 1) {
    const visible = (visibleLines[index] ?? "").replace(/\/\/.*$/u, "").trim();
    if (!visible) continue;
    if (/:root\b[^{}]*\{/iu.test(visible)) {
      const beforeRootOpen = visible.slice(0, visible.indexOf(":root"));
      rootDepth = braceDepth + (beforeRootOpen.match(/\{/gu)?.length ?? 0) + 1;
    }
    const report = (rule: string, message: string): void => {
      findings.push({ file: normalized, line: index + 1, rule, message });
    };
    if (/\.dark\b|@media[^{}]*prefers-color-scheme\s*:\s*dark/iu.test(visible)) {
      report(
        "appearance.dark-css",
        "dark-mode selectors and system theme media rules are forbidden",
      );
    }
    const isCustomProperty = /^--[\w-]+\s*:/u.test(visible);
    const isColorDeclaration =
      /^(?:color|background(?:-color)?|border(?:-[\w-]+)?|outline(?:-color)?|box-shadow|fill|stroke)\s*:/iu.test(
        visible,
      ) || isCustomProperty;
    if (isColorDeclaration) {
      const context = lines.slice(Math.max(0, index - 1), index + 1).join("\n");
      const isSemanticRootToken = isCustomProperty && rootDepth !== null && braceDepth >= rootDepth;
      const value = visible.slice(visible.indexOf(":") + 1);
      if (!isSemanticRootToken && !EXCEPTION.test(context) && isRawCssColor(value)) {
        report(
          "appearance.raw-css-color",
          "use semantic root tokens instead of literal component colors",
        );
      }
    }
    braceDepth += (visible.match(/\{/gu)?.length ?? 0) - (visible.match(/\}/gu)?.length ?? 0);
    if (rootDepth !== null && braceDepth < rootDepth) rootDepth = null;
  }
  return findings;
}

export function inspectAppearanceFile(path: string, content: string): Finding[] {
  if (path.endsWith(".css")) return inspectCss(path, content);
  return inspectTypeScript(path, content);
}

export function checkAppearance(root: string): Finding[] {
  const findings: Finding[] = [];
  const normalizedRoot = root.replaceAll("\\", "/").replace(/\/$/u, "");
  const pending = [`${normalizedRoot}/src`];
  while (pending.length > 0) {
    const directory = pending.pop();
    if (!directory) continue;
    for (const entry of Deno.readDirSync(directory)) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory) {
        if (entry.name !== "node_modules" && entry.name !== "dist") pending.push(path);
      } else if (/\.(?:tsx?|css)$/u.test(entry.name)) {
        const relativePath = path.replaceAll("\\", "/").slice(normalizedRoot.length + 1);
        findings.push(...inspectAppearanceFile(relativePath, Deno.readTextFileSync(path)));
      }
    }
  }
  return findings.sort(
    (left, right) =>
      left.file.localeCompare(right.file) ||
      left.line - right.line ||
      left.rule.localeCompare(right.rule),
  );
}
