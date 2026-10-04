/** @typedef {import("playwright").Page} Page */
/** @typedef {(page: Page, name: string) => Promise<void>} Audit */

/** Assert real content loaded; an error/empty shell is not a successful ready-state audit.
 * @param {Page} page @param {string} destination
 */
export async function assertReadyRoute(page, destination) {
  const route = destination.split("?")[0];
  if (route?.startsWith("translator/")) {
    await page.locator('[data-unit-id="unit-0"]').waitFor();
    return;
  }
  const expected = {
    login: "PopRaKo W",
    workspace: "每周任务",
    "comic-playground": "深渊回响",
    "member-list": "Mori",
    "system-mail": "任务更新",
    settings: "重置密码",
    utilities: "实用工具",
  };
  const text = expected[/** @type {keyof typeof expected} */ (route)];
  if (!text) throw new Error(`Missing ready-state assertion for ${destination}`);
  await page.getByText(text, { exact: true }).filter({ visible: true }).first().waitFor();
}

/** @param {Page} page @param {string} name @param {Audit} audit
 * @param {Awaited<ReturnType<typeof import("./contrast-api.mjs").mockContrastApi>>} fixture
 */
async function authStates(page, name, audit, fixture) {
  await page.getByRole("button", { name: "注册", exact: true }).first().click();
  await page.getByLabel("昵称").waitFor();
  await audit(page, `${name}-register`);
  await page.getByRole("button", { name: "注册", exact: true }).last().click();
  await page.getByText("QQ 号不能为空", { exact: true }).waitFor();
  await audit(page, `${name}-validation`);
  await page.getByRole("button", { name: "登录", exact: true }).first().click();
  await page.getByLabel("QQ 号", { exact: true }).fill("12345678");
  await page.getByLabel("密码", { exact: true }).fill("fixture-password");
  fixture.setMode("error");
  const rejected = page.waitForResponse((response) => response.url().endsWith("/auth/login"));
  await page.getByRole("button", { name: "登录", exact: true }).last().click();
  if ((await rejected).status() !== 503) throw new Error("Auth error fixture did not fail");
  await page.getByRole("button", { name: "登录", exact: true }).last().waitFor();
  await audit(page, `${name}-request-error`);
  fixture.setMode("loading");
  const pending = page.waitForResponse((response) => response.url().endsWith("/auth/login"));
  await page.getByRole("button", { name: "登录", exact: true }).last().click();
  await page.getByRole("button", { name: "处理中…", exact: true }).waitFor();
  await audit(page, `${name}-request-loading`);
  fixture.setMode("ready");
  if ((await pending).status() !== 200) throw new Error("Auth success fixture did not succeed");
  await page.waitForURL("**/comic-playground");
  await assertReadyRoute(page, "comic-playground");
  await audit(page, `${name}-request-success`);
}

/** @param {Page} page @param {string} destination @param {string} name
 * @param {Audit} audit @param {Audit} interactions
 * @param {Awaited<ReturnType<typeof import("./contrast-api.mjs").mockContrastApi>>} fixture
 */
export async function routeStates(page, destination, name, audit, interactions, fixture) {
  if (destination === "login") await authStates(page, name, audit, fixture);
  if (destination === "settings") {
    for (const title of ["切换汉化组", "重置密码", "上传头像"]) {
      await page.getByRole("button", { name: title, exact: true }).click();
      await page.getByRole("dialog").waitFor();
      await audit(page, `${name}-dialog-${title}`);
      await page.keyboard.press("Escape");
    }
  }
  if (destination === "utilities") {
    for (const title of ["解压并解包嵌稿", "定界压缩"]) {
      await page.getByRole("button", { name: title, exact: true }).click();
      await audit(page, `${name}-tool-${title}`);
    }
  }
  if (destination === "workspace" || destination === "comic-playground") {
    const viewport = page.viewportSize();
    await page.mouse.move((viewport?.width ?? 1440) - 3, (viewport?.height ?? 900) - 3);
    const heading = page.getByRole("heading", { name: "深渊回响", exact: true }).first();
    if (name.endsWith("desktop")) {
      await heading.locator('xpath=ancestor::*[@role="button"][1]').focus();
      await page.keyboard.press("Enter");
    } else await heading.click();
    await page.getByRole("button", { name: "关闭漫画详情", exact: true }).waitFor();
    await page.locator("[data-comic-detail-boundary]").waitFor();
    await audit(page, `${name}-comic-detail`);
    if (name.endsWith("desktop")) await interactions(page, `${name}-comic-detail`);
    await page.getByRole("button", { name: "关闭漫画详情", exact: true }).click();
  }
}
