import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";
import type { Finding } from "./check-style.ts";

const TEST_OR_STORY = /(?:\.test|\.stories)\.tsx?$/u;
const OVERLAY_TOKENS = ["fixed", "inset-0"];
const BACKDROP_POSITIONS = ["absolute", "fixed"];
const INSET_TOKENS = ["inset-0"];
const STACKING_TOKENS = /^(?:relative|absolute|fixed|sticky)$/u;
const FINDING = {
  rule: "overlay.backdrop-covers-content",
  message: "position the overlay content so the full-size backdrop cannot cover it (add relative)",
};

type Element = ts.JsxElement | ts.JsxSelfClosingElement;

function attribute(node: Element, name: string): ts.JsxAttribute | undefined {
  const attributes = ts.isJsxElement(node) ? node.openingElement.attributes : node.attributes;
  return attributes.properties.find(
    (property): property is ts.JsxAttribute =>
      ts.isJsxAttribute(property) && property.name.getText() === name,
  );
}

function classTexts(node: Element): string[] {
  const expression = attribute(node, "className")?.initializer;
  if (!expression) return [];
  if (ts.isStringLiteral(expression)) return [expression.text];
  const texts: string[] = [];
  const collect = (child: ts.Node): void => {
    if (ts.isStringLiteral(child) || ts.isNoSubstitutionTemplateLiteral(child))
      texts.push(child.text);
    if (ts.isTemplateExpression(child)) {
      texts.push(child.head.text);
      for (const span of child.templateSpans) texts.push(span.literal.text);
    }
    ts.forEachChild(child, collect);
  };
  collect(expression);
  return texts;
}

function classTokens(node: Element): Set<string> {
  return new Set(
    classTexts(node)
      .flatMap((text) => text.split(/\s+/u))
      .filter(Boolean),
  );
}

function hasTokens(node: Element, tokens: string[]): boolean {
  const classes = classTokens(node);
  return tokens.every((token) => classes.has(token));
}

function tagName(node: Element): string {
  return ts.isJsxElement(node) ? node.openingElement.tagName.getText() : node.tagName.getText();
}

function childElements(node: Element): Element[] {
  if (ts.isJsxSelfClosingElement(node)) return [];
  return node.children.filter(
    (child): child is Element => ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child),
  );
}

function isBackdrop(node: Element): boolean {
  if (tagName(node) !== "button" || !hasTokens(node, INSET_TOKENS)) return false;
  const classes = classTokens(node);
  return BACKDROP_POSITIONS.some((position) => classes.has(position));
}

function inspectOverlay(overlay: Element, report: (node: ts.Node) => void): void {
  const children = childElements(overlay);
  const backdropIndex = children.findIndex(isBackdrop);
  if (backdropIndex === -1) return;
  const content = children[backdropIndex + 1];
  if (!content) return;
  const classes = classTokens(content);
  if ([...classes].some((token) => STACKING_TOKENS.test(token))) return;
  report(content);
}

export function inspectOverlayFile(path: string, content: string): Finding[] {
  const normalized = path.replaceAll("\\", "/").replace(/^\/+/u, "");
  if (!normalized.endsWith(".tsx") || TEST_OR_STORY.test(normalized)) return [];
  const source = ts.createSourceFile(
    normalized,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const findings: Finding[] = [];
  const report = (node: ts.Node): void => {
    findings.push({
      file: normalized,
      line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
      ...FINDING,
    });
  };
  const visit = (node: ts.Node): void => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      if (hasTokens(node, OVERLAY_TOKENS)) inspectOverlay(node, report);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return findings;
}

function isProductionSource(path: string): boolean {
  return !TEST_OR_STORY.test(path) && !path.split("/").includes("test");
}

export function checkOverlay(root: string): Finding[] {
  const findings: Finding[] = [];
  const normalizedRoot = root.replaceAll("\\", "/").replace(/\/$/u, "");
  const pending = [`${normalizedRoot}/src`];
  while (pending.length > 0) {
    const directory = pending.pop();
    if (!directory) continue;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules" && entry.name !== "dist") pending.push(path);
      } else if (entry.name.endsWith(".tsx")) {
        const relativePath = path.replaceAll("\\", "/").slice(normalizedRoot.length + 1);
        if (!isProductionSource(relativePath)) continue;
        findings.push(...inspectOverlayFile(relativePath, readFileSync(path, "utf8")));
      }
    }
  }
  return findings.sort(
    (left, right) => left.file.localeCompare(right.file) || left.line - right.line,
  );
}
