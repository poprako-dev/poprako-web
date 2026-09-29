import assert from "node:assert/strict";
import { test } from "node:test";
import { inspectApiBoundary } from "./check-api-boundary.ts";

void test("API checker rejects global network bypasses and UI dependency", () => {
  assert.equal(
    inspectApiBoundary(
      "src/route/business/request.ts",
      ["fetch('/api');", "window.fetch('/api');", "new XMLHttpRequest();"].join("\n"),
    ).length,
    3,
  );
  assert.equal(
    inspectApiBoundary("src/api/client.ts", 'import { useState } from "react";').length,
    1,
  );
  assert.deepEqual(inspectApiBoundary("src/api/transport.ts", "fetch(url);"), []);
  assert.deepEqual(
    inspectApiBoundary("src/shared/utility/compress/archive-worker.ts", "fetch(wasmUrl);"),
    [],
  );
});

void test("API checker separates mechanical key conversion from domain semantics", () => {
  const findings = inspectApiBoundary(
    "src/route/business/model.ts",
    [
      "const a = { pageId: raw.page_id, image_hash: item.imageHash };",
      "const b = { extension: data.ext, name: user.nickname };",
    ].join("\n"),
  );
  assert.equal(findings.length, 2);
  assert.ok(findings.every((finding) => finding.rule === "api.manual-case-conversion"));
});
