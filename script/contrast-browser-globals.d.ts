import type * as DomAudit from "./contrast-dom.mjs";
import type * as Axe from "axe-core";

declare global {
  const __CONTRAST_EVIDENCE__: boolean;
  var axe: typeof Axe;
  var contrastAudit: typeof DomAudit;
}

export {};
