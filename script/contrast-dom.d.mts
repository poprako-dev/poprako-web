import type { AxeResults } from "axe-core";
import type Color from "colorjs.io";

type Pair = {
  foreground: Color;
  background: Color;
  uncertainties: string[];
};
type NonTextPair = {
  target: string;
  kind: string | null;
  color: string;
  background: string;
  ratio: number;
  minimum: number;
  uncertainties: string[];
};

export function renderedPair(element: Element, ink: string): Pair;
export function settleContrastState(): Promise<void>;
export function proveTextContrast(element: Element): {
  target: string;
  foreground: string;
  background: string;
  ratio: number | null;
  minimum: number | null;
  geometry: unknown[];
  occlusion: unknown[];
};
export function resolveIncompleteContrast(results: AxeResults): {
  proofs: ReturnType<typeof proveTextContrast>[];
  unresolved: { target: unknown; message: string }[];
};
export function auditNonText(root?: Document | Element): {
  pairs: NonTextPair[];
  failures: NonTextPair[];
};
