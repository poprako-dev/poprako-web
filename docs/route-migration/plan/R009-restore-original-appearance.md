# R009 · Restore original light appearance

Status: in-progress. Reference: `68cedc0`.

1. Inventory original/current visual attributes using the migration mapping,
   following extracted components and style constants as well as route entries.
2. Restore original light CSS values and component styles; retain semantic
   tokens with exact original values, including opacity and state differences.
3. Review shared UI and navigation, then every route, modal, and translator
   state. Retain current logic and accessibility semantics.
4. Compare baseline/current browser renders and computed styles, run existing
   checks, and record actual results and remaining differences in the review.

Implementation must not replace whole business files with historical versions.
No worker fanout, commit, push, or deployment is part of this task.
