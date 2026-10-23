import { expect, test } from "vitest";
import { checkHeavyBundles, type HeavyChunk } from "./check-heavy-bundle.ts";

const utilities = "/project/src/route/_authenticated/_shell/utilities/business/Utilities.tsx";

function chunk(fileName: string, modules: string[], imports: string[] = [], code = ""): HeavyChunk {
  return {
    fileName,
    modules: Object.fromEntries(modules.map((id) => [id, {}])),
    imports,
    isEntry: fileName === "index.js",
    code,
  };
}

test("allows deferred codecs and worker URLs without requiring worker modules in the main bundle", () => {
  const chunks = [
    chunk("index.js", ["/project/src/main.tsx"]),
    chunk(
      "utilities.js",
      [utilities, "/project/src/shared/utility/compress.ts"],
      [],
      'new Worker(new URL("archive-worker.js", import.meta.url)); import("./bounded.js")',
    ),
    chunk("bounded.js", ["/project/node_modules/@zip.js/zip.js/index.js"]),
    chunk("export.js", ["/project/node_modules/jszip/lib/index.js"]),
  ];
  expect(() => {
    checkHeavyBundles(chunks, []);
  }).not.toThrow();
});

test.each([
  "/project/node_modules/.pnpm/simple-wasi-zstd@0.1.5/node_modules/simple-wasi-zstd/libzstd.js",
  "C:\\project\\node_modules\\.pnpm\\ag-psd@31.0.2\\node_modules\\ag-psd\\dist\\index.js",
  "/project/node_modules/.pnpm/@zip.js+zip.js@2.11.1/node_modules/@zip.js/zip.js/index.js",
  "/project/node_modules/browser-image-compression/dist/browser-image-compression.js",
  "/project/node_modules/modern-tar/dist/index.js",
  "/project/node_modules/jszip/lib/index.js",
  "/project/src/shared/utility/compress/zstd-codec.ts",
  "/project/src/shared/utility/compress/zstd.ts",
  "/project/src/shared/utility/compress/core.ts",
  "/project/src/shared/utility/compress/archive-worker.ts",
  "/project/src/shared/utility/image/composite-worker.ts",
  "/project/src/route/_authenticated/_shell/utilities/business/bounded-compression.ts",
  "C:\\project\\src\\codec.wasm?url",
])("rejects a heavy module pulled into the initial graph through a shared chunk: %s", (module) => {
  const chunks = [
    chunk("index.js", ["/project/src/main.tsx"], ["shared.js"]),
    chunk("shared.js", ["/project/src/shared/helper.ts"], ["codec.js"]),
    chunk("codec.js", [module]),
    chunk("utilities.js", [utilities]),
  ];
  expect(() => {
    checkHeavyBundles(chunks, []);
  }).toThrow(/Heavy codec.*initial static dependency graph/u);
});

test("rejects a heavy implementation merged into an initial entry chunk", () => {
  const chunks = [
    chunk("index.js", ["/project/src/main.tsx", "/project/node_modules/ag-psd/dist/index.js"]),
    chunk("utilities.js", [utilities]),
  ];
  expect(() => {
    checkHeavyBundles(chunks, []);
  }).toThrow("initial static dependency graph");
});

test.each([
  "WebAssembly.compileStreaming(response)",
  "WebAssembly.instantiate(bytes)",
  'const embedded = "AGFzbQEAAAA="',
])("rejects embedded WASM without a .wasm module id: %s", (code) => {
  const chunks = [
    chunk("index.js", ["/project/src/main.tsx"], ["shared.js"]),
    chunk("shared.js", ["/project/src/encoder.ts"], [], code),
    chunk("utilities.js", [utilities]),
  ];
  expect(() => {
    checkHeavyBundles(chunks, []);
  }).toThrow("Heavy codec embedded WASM");
});

test("guards Utilities independently when a shared chunk pulls compression back into its graph", () => {
  const chunks = [
    chunk("index.js", ["/project/src/main.tsx"]),
    chunk("utilities.js", [utilities], ["shared.js"]),
    chunk("shared.js", ["/project/src/shared/helper.ts"], ["codec.js"]),
    chunk("codec.js", ["/project/node_modules/simple-wasi-zstd/libzstd.js"]),
  ];
  expect(() => {
    checkHeavyBundles(chunks, []);
  }).toThrow("Utilities static dependency graph");
});

test("fails closed when a protected entry is missing", () => {
  expect(() => {
    checkHeavyBundles([chunk("utilities.js", [utilities])], []);
  }).toThrow("Missing heavy bundle boundary entry: initial");
  expect(() => {
    checkHeavyBundles([chunk("index.js", ["/project/src/main.tsx"])], []);
  }).toThrow("Missing heavy bundle boundary entry: Utilities");
});

test.each([
  "login/business/LoginCard.tsx",
  "_authenticated/_shell/workspace/business/Workspace.tsx",
])("guards a dynamically loaded route's own static imports: %s", (route) => {
  const chunks = [
    chunk("index.js", ["/project/src/main.tsx"], [], 'import("./route.js")'),
    chunk("route.js", [`/project/src/route/${route}`], ["codec.js"]),
    chunk("codec.js", ["/project/node_modules/simple-wasi-zstd/libzstd.js"]),
    chunk("utilities.js", [utilities]),
  ];
  expect(() => {
    checkHeavyBundles(chunks, [route]);
  }).toThrow(`route ${route} static dependency graph`);
});

test("rejects a shared chunk pulling heavy code into the dynamic login route", () => {
  const login = "login/business/LoginCard.tsx";
  const chunks = [
    chunk("index.js", ["/project/src/main.tsx"], [], 'import("./login.js")'),
    chunk("login.js", [`/project/src/route/${login}`], ["shared.js"]),
    chunk("shared.js", ["/project/src/shared/helper.ts"], ["codec.js"]),
    chunk("codec.js", ["/project/node_modules/@zip.js/zip.js/index.js"]),
    chunk("utilities.js", [utilities]),
  ];
  expect(() => {
    checkHeavyBundles(chunks, [login]);
  }).toThrow(`route ${login} static dependency graph`);
});

test("allows an operation to dynamically import a codec from a protected route", () => {
  const login = "login/business/LoginCard.tsx";
  const chunks = [
    chunk("index.js", ["/project/src/main.tsx"], [], 'import("./login.js")'),
    chunk("login.js", [`/project/src/route/${login}`], [], 'import("./codec.js")'),
    chunk("codec.js", ["/project/node_modules/simple-wasi-zstd/libzstd.js"]),
    chunk("utilities.js", [utilities]),
  ];
  expect(() => {
    checkHeavyBundles(chunks, [login]);
  }).not.toThrow();
});

test("fails closed when an explicitly protected route is absent", () => {
  const login = "login/business/LoginCard.tsx";
  expect(() => {
    checkHeavyBundles(
      [chunk("index.js", ["/project/src/main.tsx"]), chunk("utilities.js", [utilities])],
      [login],
    );
  }).toThrow(`Missing heavy bundle boundary entry: route ${login}`);
});
