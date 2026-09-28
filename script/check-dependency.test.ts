import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { inspectDependencyEntries } from "./check-dependency.ts";

void test("dependency checker resolves aliases and allows explicit integration assembly", async () => {
  const root = await mkdtemp(join(tmpdir(), "poprako-dependency-check-"));
  try {
    await writeFile(
      join(root, "tsconfig.base.json"),
      JSON.stringify({
        compilerOptions: { baseUrl: ".", paths: { "@/*": ["src/*"] } },
      }),
    );
    for (const route of ["alpha", "beta"]) {
      const directory = join(root, "src/routes", route);
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, "index.tsx"), "export {};\n");
      await mkdir(join(directory, "business"), { recursive: true });
    }
    await mkdir(join(root, "src/application/test"), { recursive: true });
    await mkdir(join(root, "src/shared/utility"), { recursive: true });
    await writeFile(join(root, "src/routes/beta/business/model.ts"), "export const model = 1;\n");
    await writeFile(join(root, "src/routes/beta/feature.ts"), "export const feature = 1;\n");
    await writeFile(join(root, "src/shared/utility/sample.test.ts"), "export {};\n");
    const findings = inspectDependencyEntries(
      [
        {
          path: "src/routes/alpha/page.tsx",
          content: [
            'import "@/routes/beta/feature";',
            'import "@/shared/utility/sample.test";',
          ].join("\n"),
        },
        {
          path: "src/application/test/root.test.ts",
          content: 'import "@/routes/beta/feature";',
        },
      ],
      root,
    );
    assert.equal(findings.length, 2);
    assert.match(findings[0]?.message ?? "", /alpha\/page\.tsx → src\/routes\/beta\/feature\.ts/u);
    assert.match(findings[1]?.message ?? "", /production code cannot import tests/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test("route modules may import their own route business package", async () => {
  const root = await mkdtemp(join(tmpdir(), "poprako-dependency-allowed-"));
  try {
    await writeFile(
      join(root, "tsconfig.base.json"),
      JSON.stringify({
        compilerOptions: { baseUrl: ".", paths: { "@/*": ["src/*"] } },
      }),
    );
    const route = join(root, "src/routes/alpha");
    await mkdir(join(route, "business"), { recursive: true });
    await writeFile(join(route, "index.tsx"), "export {};\n");
    await writeFile(join(route, "business/model.ts"), "export const model = 1;\n");
    assert.deepEqual(
      inspectDependencyEntries(
        [
          {
            path: "src/routes/alpha/page.tsx",
            content: 'import "@/routes/alpha/business/model";',
          },
        ],
        root,
      ),
      [],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test("checker rejects common business to route imports and dynamic generated HTML errors", async () => {
  const root = await mkdtemp(join(tmpdir(), "poprako-dependency-generated-"));
  try {
    await writeFile(
      join(root, "tsconfig.base.json"),
      JSON.stringify({
        compilerOptions: { baseUrl: ".", paths: { "@/*": ["src/*"] } },
      }),
    );
    const alpha = join(root, "src/routes/alpha");
    const common = join(root, "src/routes/business");
    await mkdir(alpha, { recursive: true });
    await mkdir(common, { recursive: true });
    await writeFile(join(alpha, "index.tsx"), "export {};\n");
    await writeFile(join(alpha, "Utilities.tsx"), "export function Utilities() {}\n");
    await writeFile(join(common, "request.ts"), "export {};\n");
    await writeFile(join(common, "index.tsx"), "export {};\n");
    const inlineScript = [
      "<script",
      ' type="module">',
      "import Utilities from '/src/routes/alpha/Utilities.tsx';",
      "</script>",
    ].join("");
    const findings = inspectDependencyEntries(
      [
        {
          path: "src/routes/business/request.ts",
          content: [
            'import "@/routes/alpha";',
            'import "@/routes/business";',
            "new Worker(workerPath);",
            "const moduleName = './dynamic';",
            "void import(moduleName);",
          ].join("\n"),
        },
        {
          path: "script/generated.mjs",
          content: `const html = \`${inlineScript}\`;`,
        },
      ],
      root,
    );
    assert.equal(findings.length, 5, JSON.stringify(findings));
    assert.match(findings.map((finding) => finding.rule).join(" "), /dependency\.dynamic/u);
    assert.match(findings.map((finding) => finding.rule).join(" "), /dependency\.default-import/u);
    assert.match(
      findings[0]?.message ?? "",
      /src\/routes\/business\/request\.ts → src\/routes\/alpha\/index\.tsx/u,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
