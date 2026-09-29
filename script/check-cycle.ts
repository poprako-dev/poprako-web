import type { Finding } from "./check-style.ts";

export type ModuleEdge = {
  from: string;
  to: string;
  line: number;
  clause: string;
  defaultImport?: boolean;
  typeOnly?: boolean;
};

export function checkRuntimeCycles(edges: ModuleEdge[]): Finding[] {
  const graph = new Map<string, ModuleEdge[]>();
  for (const edge of edges) {
    if (edge.typeOnly || !edge.from.startsWith("src/") || !edge.to.startsWith("src/")) continue;
    const outgoing = graph.get(edge.from) ?? [];
    outgoing.push(edge);
    graph.set(edge.from, outgoing);
  }
  const findings: Finding[] = [];
  const complete = new Set<string>();
  const active = new Set<string>();
  const stack: string[] = [];
  const visit = (path: string): void => {
    if (complete.has(path)) return;
    active.add(path);
    stack.push(path);
    for (const edge of graph.get(path) ?? []) {
      if (active.has(edge.to)) {
        findings.push({
          file: path,
          line: edge.line,
          rule: "dependency.cycle",
          message: [...stack.slice(stack.indexOf(edge.to)), edge.to].join(" → "),
        });
      } else {
        visit(edge.to);
      }
    }
    stack.pop();
    active.delete(path);
    complete.add(path);
  };
  for (const path of graph.keys()) visit(path);
  return findings;
}
