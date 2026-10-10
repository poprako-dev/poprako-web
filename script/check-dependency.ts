import { relative, resolve } from "node:path";
import ts from "typescript";
import { routeDirectories, routeRelation, sourceDomain } from "./route-ownership.ts";
import { checkRuntimeCycles, type ModuleEdge } from "./check-cycle.ts";
import {
  collectEdges,
  isIntegrationTest,
  isRoute,
  isTestPath,
  sourceFiles,
} from "./check-dependency-edges.ts";
import type { SourceEntry } from "./check-dependency-edges.ts";
import type { Finding } from "./check-style.ts";

export function inspectDependencyEntries(entries: SourceEntry[], root: string): Finding[] {
  const edges = collectEdges(entries, root);
  const findings: Finding[] = checkRuntimeCycles(edges);
  const owners = routeDirectories(root);
  for (const edge of edges) {
    findings.push(...inspectEdgeResolution(edge, root));
    if (hasTerminalResolution(edge)) continue;
    const direction = inspectDependencyDirection(edge, owners);
    if (direction) findings.push(direction);
  }
  return findings;
}

function hasTerminalResolution(edge: ModuleEdge): boolean {
  return edge.to === "@dynamic" || edge.to.startsWith("@unresolved:");
}

function inspectEdgeResolution(edge: ModuleEdge, root: string): Finding[] {
  if (edge.to === "@dynamic") {
    return [
      finding(
        edge,
        "dependency.dynamic",
        `${edge.from}: ${edge.clause} needs an explicit finite import map`,
      ),
    ];
  }
  if (edge.to.startsWith("@unresolved:")) {
    return [
      finding(
        edge,
        "dependency.unresolved",
        `${edge.from} → ${edge.to.slice("@unresolved:".length)}: local module target could not be resolved`,
      ),
    ];
  }
  if (!hasInvalidDefaultImport(edge, root)) return [];
  return [
    finding(
      edge,
      "dependency.default-import",
      `${edge.from} → ${edge.to}: default import has no default export`,
    ),
  ];
}

function hasInvalidDefaultImport(edge: ModuleEdge, root: string): boolean {
  return (
    Boolean(edge.defaultImport) &&
    !edge.to.includes("/node_modules/") &&
    !edge.to.endsWith(".d.ts") &&
    !moduleHasDefaultExport(root, edge.to)
  );
}

function inspectDependencyDirection(
  edge: ModuleEdge,
  owners: ReturnType<typeof routeDirectories>,
): Finding | undefined {
  const sourceTest = isTestPath(edge.from);
  const targetTest = isTestPath(edge.to);
  if (!sourceTest && targetTest)
    return directionFinding(edge, "production code cannot import tests, stories, or fixtures");
  if (isForbiddenSharedOrApiDependency(edge)) return directionFinding(edge, directionMessage(edge));
  if (edge.from.startsWith("src/route/") && edge.to.startsWith("src/application/")) {
    return directionFinding(edge, "routes cannot depend on application assembly");
  }
  return inspectRouteDirection(edge, owners, sourceTest);
}

function isForbiddenSharedOrApiDependency(edge: ModuleEdge): boolean {
  const forbiddenSharedTarget =
    edge.to.startsWith("src/route/") ||
    edge.to.startsWith("src/application/") ||
    edge.to.startsWith("src/api/");
  const forbiddenApiTarget =
    edge.to.startsWith("src/route/") ||
    edge.to.startsWith("src/application/") ||
    edge.to.startsWith("src/shared/component/") ||
    edge.to.startsWith("src/shared/hook/");
  return (
    (edge.from.startsWith("src/shared/") && forbiddenSharedTarget) ||
    (edge.from.startsWith("src/api/") && forbiddenApiTarget)
  );
}

function directionMessage(edge: ModuleEdge): string {
  return edge.from.startsWith("src/shared/")
    ? "shared modules cannot depend on API, routes or application assembly"
    : "API cannot depend on route business, application, React hooks or UI";
}

function inspectRouteDirection(
  edge: ModuleEdge,
  owners: ReturnType<typeof routeDirectories>,
  sourceTest: boolean,
): Finding | undefined {
  if (!isRoute(edge.from) || !isRoute(edge.to)) return undefined;
  if (sourceTest && isIntegrationTest(edge.from)) return undefined;
  if (edge.from.includes("/business/") && !edge.to.includes("/business/")) {
    return directionFinding(edge, "route business cannot depend on route entrypoints");
  }
  return inspectRouteOwnership(edge, owners);
}

function inspectRouteOwnership(
  edge: ModuleEdge,
  owners: ReturnType<typeof routeDirectories>,
): Finding | undefined {
  const sourceRoute = sourceDomain(edge.from, owners);
  const targetRoute = sourceDomain(edge.to, owners);
  if (
    sourceRoute === "@common-business" &&
    (targetRoute !== "@common-business" ||
      /^src\/route\/business\/(?:Index|Route)\.tsx?$/u.test(edge.to))
  ) {
    return directionFinding(
      edge,
      "route business modules cannot depend on route implementation modules",
    );
  }
  const relation = routeRelation(edge.from, edge.to, owners);
  if (relation === "same" || (relation === "ancestor" && edge.to.includes("/business/"))) {
    return undefined;
  }
  return relation === "sibling"
    ? directionFinding(
        edge,
        "a route may depend only on its own package or ancestor business modules",
      )
    : undefined;
}

function directionFinding(edge: ModuleEdge, clause: string): Finding {
  return finding(
    edge,
    "dependency.direction",
    `${edge.from} → ${edge.to}: ${clause} (${edge.clause})`,
  );
}

function finding(edge: ModuleEdge, rule: string, message: string): Finding {
  return { file: edge.from, line: edge.line, rule, message };
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
