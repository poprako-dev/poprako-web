# R002 · API foundation

**Owner:** root integration. **Dependencies:** R001. **Status:** done.

**Interfaces:** an independent `src/api` HTTP transport and response envelope;
route-owned request adapters; reusable `toCamelCase` / `toSnakeCase` based on
`../porpako-native-sv` and `../poprako-ws` implementations. Transport receives
auth headers and cancellation from callers and never imports session state.

**Work:** establish Deno-resolvable API foundation; preserve base URL, Bearer
behavior, `Result<T>`/HTTP metadata, cancellation, and 204/non-JSON handling.
Conversion is applied to payload objects, not rebuilt field by field; validate
exceptional domain semantics at the boundary.

**Deletion:** legacy `src/api` mixed business folder and duplicate per-field
casing converters after callers migrate; preserve the independent `src/api`
boundary itself.

**Tests/evidence:** transport unit tests for
success/envelope/errors/204/non-JSON/abort; converter parity tests for nested
records, arrays, nulls and exceptions; search to show no route dependency from
`api`; record conversion source and test outputs.

Final evidence: [implementation results](../review/implementation-results.md).
