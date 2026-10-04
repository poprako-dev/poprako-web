/// <reference lib="dom" />
/// <reference path="./contrast-browser-globals.d.ts" />
import { build, preview } from "vite";
import { chromium } from "playwright";
import tailwindPostcss from "@tailwindcss/postcss";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createViteBase } from "../src/application/vite-base.ts";
import { fixedTime, mockContrastApi } from "./fixture/contrast-api.mjs";
import { checkContrastProofs } from "./fixture/contrast-proof-browser.mjs";
import { assertReadyRoute, routeStates } from "./fixture/contrast-route-scenes.mjs";
import { colorChange, composite, contrast, minimumContrast } from "./contrast-color.mjs";
import { imageLabels, resolveToken, roles } from "./contrast-contract.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const referenceIndex = Deno.args.indexOf("--reference-source");
const sourceRoot = referenceIndex >= 0 ? Deno.args[referenceIndex + 1] : root;
if (!sourceRoot) {
  throw new Error("--reference-source requires a checkout directory");
}
const appRoot = Deno.realPathSync(sourceRoot);
const generated = path.join(root, "test-resource/generated/contrast");
const output = path.join(generated, Deno.args.includes("--capture") ? "reference" : "after");
await Deno.remove(output, { recursive: true }).catch((error) => {
  if (!(error instanceof Deno.errors.NotFound)) throw error;
});
await Deno.mkdir(output, { recursive: true });
const base = createViteBase();
await build({
  ...base,
  configFile: false,
  root: appRoot,
  logLevel: "warn",
  resolve: { ...base.resolve, alias: { "@": path.join(appRoot, "src") } },
  // Tailwind defaults to cwd; the archived base must scan its own class names.
  css: { postcss: { plugins: [tailwindPostcss({ base: appRoot })] } },
  build: {
    ...base.build,
    outDir: path.join(generated, "app"),
    emptyOutDir: true,
  },
});
await build({
  configFile: false,
  root,
  logLevel: "warn",
  build: {
    outDir: path.join(generated, "audit"),
    lib: {
      entry: path.join(root, "script/contrast-dom.mjs"),
      name: "contrastAudit",
      formats: ["iife"],
      fileName: () => "audit.js",
    },
  },
});
const server = await preview({
  ...base,
  configFile: false,
  root,
  build: { outDir: path.join(generated, "app") },
  preview: { host: "127.0.0.1", port: 4187, strictPort: true },
});
const browser = await chromium.launch({ headless: true });
/** @type {{name: string, violations: import("axe-core").Result[], contrast: ReturnType<typeof contrastAudit.resolveIncompleteContrast>, nonText: ReturnType<typeof contrastAudit.auditNonText>}[]} */
const reports = [];
const setupErrors = /** @type {{name: string, error: string}[]} */ ([]);
let exitCode = 0;
/** @type {{overlay: string, foreground: string} | undefined} */
let renderedImageLabel;

/** @param {import("playwright").Page} page @param {string} name */
async function audit(page, name) {
  await page.evaluate(() => contrastAudit.settleContrastState());
  if (!renderedImageLabel && name.endsWith("-comic-detail")) {
    renderedImageLabel = await page
      .locator("[data-page-index]")
      .first()
      .evaluate((element) => {
        if (!element.parentElement) {
          throw new Error("Image label has no backing plate");
        }
        return {
          foreground: getComputedStyle(element).color,
          overlay: getComputedStyle(element.parentElement).backgroundColor,
        };
      });
  }
  const report = await page.evaluate(async () => {
    const result = await axe.run(document.body, {
      runOnly: ["color-contrast"],
    });
    return {
      violations: result.violations,
      contrast: contrastAudit.resolveIncompleteContrast(result),
      nonText: contrastAudit.auditNonText(),
    };
  });
  reports.push({ name, ...report });
  await page.screenshot({ path: path.join(output, `${name}.png`) });
}

/** @param {import("playwright").Page} page @param {string} name */
async function interactions(page, name) {
  const modal = page
    .locator("[data-comic-detail-boundary],[role=dialog]")
    .filter({ visible: true })
    .last();
  const scope = (await modal.count()) ? modal : page.locator("body");
  const controls = scope.locator(
    "button:not(:disabled),a[href],input:not(:disabled):not([type=file]),textarea:not(:disabled),[role=button]",
  );
  const seen = new Set();
  for (let index = 0; index < (await controls.count()); index++) {
    const control = controls.nth(index);
    if (!(await control.isVisible())) continue;
    if (
      !(await control.evaluate(
        (element) =>
          element.checkVisibility({
            checkOpacity: true,
            checkVisibilityCSS: true,
          }) && !element.closest("[inert]"),
      ))
    ) {
      continue;
    }
    const signature = await control.evaluate((element) => element.className);
    if (seen.has(signature)) continue;
    seen.add(signature);
    await control.hover();
    await audit(page, `${name}-hover-${seen.size}`);
  }
  const viewport = page.viewportSize();
  await page.mouse.move((viewport?.width ?? 1440) - 3, (viewport?.height ?? 900) - 3);
  if (await modal.count()) {
    await page.keyboard.press("Tab");
    await controls.first().focus();
    await audit(page, `${name}-focus-0`);
  }
  // Tab activates :focus-visible and focus-within, unlike programmatic click/focus.
  const focused = new Set();
  const focusLimit = (await controls.count()) + 2;
  for (let index = 0; index < focusLimit; index++) {
    await page.keyboard.press("Tab");
    if (!(await scope.evaluate((element) => element.contains(document.activeElement)))) break;
    const signature = await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 500));
    if (!signature || focused.has(signature)) break;
    focused.add(signature);
    await audit(page, `${name}-focus-${index + 1}`);
  }
}

/** @param {import("playwright").Page} page */
async function installAudit(page) {
  await page.addScriptTag({
    path: path.join(root, "node_modules/axe-core/axe.min.js"),
  });
  await page.addScriptTag({ path: path.join(generated, "audit/audit.js") });
}

const destinations = [
  "workspace",
  "comic-playground",
  "member-list",
  "system-mail",
  "settings",
  "utilities",
  "translator/chapter-1/page-1",
  "translator/chapter-1/page-2",
  "translator/chapter-1/page-1?readOnly=true",
];

/** Every scenario uses the same data/time and records setup errors, including role/error cases.
 * @param {string} destination @param {string} name
 * @param {{viewport?: {width: number, height: number}, identity?: "admin" | "member" | "no-team", mode?: "ready" | "empty" | "error" | "loading", photos?: boolean}} options
 * @param {(page: import("playwright").Page, fixture: Awaited<ReturnType<typeof mockContrastApi>>) => Promise<void>} scene
 */
async function runScene(destination, name, options, scene) {
  const page = await browser.newPage({
    viewport: options.viewport ?? { width: 1440, height: 900 },
    timezoneId: "Asia/Shanghai",
  });
  await page.clock.setFixedTime(new Date(fixedTime));
  const fixture = await mockContrastApi(page, options.identity, options.mode, options.photos);
  try {
    await page.goto(`http://127.0.0.1:4187/${destination}`);
    if (options.mode === "loading") await page.waitForTimeout(200);
    else await page.waitForLoadState("networkidle");
    const expected = new URL(destination, "http://127.0.0.1:4187/").pathname;
    if (new URL(page.url()).pathname !== expected) {
      throw new Error(`Unexpected route ${page.url()}`);
    }
    await installAudit(page);
    await scene(page, fixture);
    if (fixture.unknown.length) {
      throw new Error(`Unmocked requests: ${fixture.unknown.join(", ")}`);
    }
  } catch (error) {
    setupErrors.push({ name, error: String(error) });
    console.error(`Contrast setup failed: ${name}: ${String(error)}`);
    await page.screenshot({
      path: path.join(output, `${name}-setup-error.png`),
    });
  } finally {
    await page.close();
  }
}
try {
  const proofPage = await browser.newPage();
  await installAudit(proofPage);
  const selfTest = await checkContrastProofs(proofPage);
  await proofPage.close();
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const device = viewport.width === 390 ? "mobile" : "desktop";
    for (const destination of ["login", ...destinations]) {
      const name = `${destination.replaceAll(/[^a-zA-Z0-9-]/g, "-")}-${device}`;
      await runScene(destination, name, { viewport }, async (page, fixture) => {
        await assertReadyRoute(page, destination);
        await audit(page, name);
        if (device === "desktop") await interactions(page, name);
        await routeStates(page, destination, name, audit, interactions, fixture);
      });
    }
  }
  for (const identity of ["member", "no-team"]) {
    for (const destination of ["workspace", "member-list", "settings"]) {
      const name = `${destination}-${identity}`;
      await runScene(
        destination,
        name,
        { identity: /** @type {"member" | "no-team"} */ (identity) },
        async (page) => {
          await audit(page, name);
        },
      );
    }
  }
  for (const destination of ["workspace", "settings"]) {
    const name = `${destination}-photos`;
    await runScene(destination, name, { photos: true }, async (page) => {
      await assertReadyRoute(page, destination);
      await audit(page, name);
      await interactions(page, name);
    });
  }
  for (const mode of ["empty", "error", "loading"]) {
    for (const destination of [
      "workspace",
      "comic-playground",
      "member-list",
      "system-mail",
      "translator/chapter-1/page-1",
    ]) {
      const name = `${destination.replaceAll("/", "-")}-${mode}`;
      await runScene(
        destination,
        name,
        { mode: /** @type {"empty" | "error" | "loading"} */ (mode) },
        async (page, fixture) => {
          await audit(page, name);
          if (mode === "error") {
            fixture.setMode("ready");
            const retry = page.getByRole("button", { name: /重试|重新加载/ });
            if (await retry.count()) {
              await retry.first().click();
              await page.waitForLoadState("networkidle");
              await assertReadyRoute(page, destination);
              await audit(page, `${destination.replaceAll("/", "-")}-retry`);
            }
          }
        },
      );
    }
  }
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:4187/login");
  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries(
      [...style]
        .filter((key) => key.startsWith("--"))
        .map((key) => [key, style.getPropertyValue(key).trim()]),
    );
  });
  const colors = roles.map((role) => {
    const current = Deno.args.includes("--capture")
      ? (tokens[role.token] ?? role.original)
      : resolveToken(tokens, role.token);
    const minimum = role.minimum ?? 4.5;
    const ratio = minimumContrast(current, role.backgrounds);
    return {
      ...role,
      ...colorChange(role.original, current),
      ratio,
      minimum,
      passed: ratio >= minimum && colorChange(role.original, current).inSrgb,
    };
  });
  if (!renderedImageLabel) {
    throw new Error("Image label was not rendered in a route fixture");
  }
  const { overlay, foreground: ink } = renderedImageLabel;
  const labels = ["#fff", "#000"].map((image) => ({
    image,
    ratio: contrast(ink, composite(overlay, image)),
  }));
  const failed = reports.filter(
    (r) => r.violations.length || r.contrast.unresolved.length || r.nonText.failures.length,
  );
  await Deno.writeTextFile(
    path.join(output, "report.json"),
    JSON.stringify(
      {
        viewport: "1440x900 / 390x844",
        fixedTime,
        selfTest,
        colors,
        imageLabels: {
          ...colorChange(imageLabels.originalOverlay, overlay),
          foreground: colorChange(imageLabels.originalForeground, ink),
          labels,
        },
        setupErrors,
        reports,
        passed:
          !setupErrors.length &&
          !failed.length &&
          colors.every((c) => c.passed) &&
          labels.every((l) => l.ratio >= 4.5),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Contrast: ${reports.length} states, ${failed.length} failures, ${setupErrors.length} setup errors; evidence: ${output}`,
  );
  if (
    setupErrors.length ||
    (!Deno.args.includes("--capture") &&
      (failed.length || colors.some((c) => !c.passed) || labels.some((l) => l.ratio < 4.5)))
  ) {
    exitCode = 1;
  }
  await page.close();
} catch (error) {
  await Deno.writeTextFile(
    path.join(output, "report.json"),
    JSON.stringify({ passed: false, fatal: String(error), setupErrors, reports }, null, 2),
  );
  console.error(error);
  exitCode = 1;
} finally {
  await browser.close();
  await new Promise((resolve, reject) =>
    server.httpServer.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}
// Vite/Node cleanup can change the shared process exit code; finalize it after disposal.
if (exitCode) Deno.exit(exitCode);
