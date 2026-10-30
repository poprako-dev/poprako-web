import { spawn, type ChildProcess } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type Page } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const outputDirectory = join(root, "docs/images/readme");
const storybookPort = 6007;
const storybookUrl = `http://127.0.0.1:${String(storybookPort)}`;

type Capture = {
  storyId: string;
  file: string;
  width: number;
  height: number;
  waitFor?: (page: Page) => Promise<void>;
};

const sourceText = "如果风停了，信就送不到了吧。";

async function waitForSourceText(page: Page): Promise<void> {
  await page.waitForFunction(
    (needle) =>
      Array.from(document.querySelectorAll("input, textarea")).some(
        (element) =>
          "value" in element &&
          (element as HTMLInputElement | HTMLTextAreaElement).value === needle,
      ),
    sourceText,
  );
}

async function waitForFocusedUnit(page: Page): Promise<void> {
  await waitForSourceText(page);
  await page.getByRole("group", { name: "优选符号" }).waitFor();
}

const captures: Capture[] = [
  { storyId: "readme-workspace--filled", file: "workspace.png", width: 1440, height: 900 },
  {
    storyId: "readme-comicplayground--filled",
    file: "comic-playground.png",
    width: 1440,
    height: 900,
  },
  {
    storyId: "readme-translator--proofread",
    file: "translator-proofread.png",
    width: 1440,
    height: 900,
    waitFor: waitForSourceText,
  },
  {
    storyId: "readme-translator--unit-detail",
    file: "translator-unit-detail.png",
    width: 576,
    height: 520,
    waitFor: waitForFocusedUnit,
  },
  {
    storyId: "readme-reviewer--filled",
    file: "reviewer.png",
    width: 1440,
    height: 900,
    waitFor: async (page) => {
      await page.getByLabel("标注 5 说明").first().waitFor();
    },
  },
  {
    storyId: "readme-members--filled",
    file: "members.png",
    width: 1440,
    height: 900,
    waitFor: async (page) => {
      await page.getByText("林间晚风").first().waitFor();
    },
  },
  {
    storyId: "readme-utilities--filled",
    file: "utilities.png",
    width: 1440,
    height: 900,
    waitFor: async (page) => {
      await page.getByText("星渡りの旅人").first().waitFor();
    },
  },
];

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function startStorybook(): ChildProcess {
  const require = createRequire(import.meta.url);
  const cli = join(dirname(require.resolve("storybook/package.json")), "dist/bin/dispatcher.js");
  return spawn(
    process.execPath,
    [
      cli,
      "dev",
      "--ci",
      "--exact-port",
      "--no-open",
      "--disable-telemetry",
      "--quiet",
      "--port",
      String(storybookPort),
    ],
    { cwd: root, stdio: ["ignore", "ignore", "pipe"] },
  );
}

function collectStderr(child: ChildProcess): () => string {
  let output = "";
  child.stderr?.on("data", (chunk: Buffer) => {
    output = `${output}${chunk.toString()}`.slice(-4000);
  });
  return () => output;
}

async function waitForStorybook(child: ChildProcess, readStderr: () => string): Promise<void> {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Storybook exited before serving ${storybookUrl}.\n${readStderr()}`);
    }
    try {
      const response = await fetch(`${storybookUrl}/iframe.html`);
      if (response.ok) return;
    } catch {
      // The preview server is still starting.
    }
    await delay(250);
  }
  throw new Error(`Storybook did not serve ${storybookUrl} within 90s.\n${readStderr()}`);
}

async function settlePage(page: Page): Promise<void> {
  await page.waitForFunction(
    () => Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
    undefined,
    { timeout: 60_000 },
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  });
  await page.waitForTimeout(500);
}

async function captureStory(browser: Browser, capture: Capture): Promise<void> {
  const context = await browser.newContext({
    viewport: { width: capture.width, height: capture.height },
    deviceScaleFactor: 2,
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
  });
  try {
    const page = await context.newPage();
    await page.goto(`${storybookUrl}/iframe.html?id=${capture.storyId}&viewMode=story`, {
      waitUntil: "load",
      timeout: 120_000,
    });
    await page.waitForSelector("#storybook-root > *", { timeout: 60_000 });
    await capture.waitFor?.(page);
    await settlePage(page);
    await page.screenshot({ path: join(outputDirectory, capture.file), type: "png" });
    console.log(`captured ${capture.file}`);
  } finally {
    await context.close();
  }
}

async function stopStorybook(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    const forceKill = setTimeout(() => {
      child.kill("SIGKILL");
    }, 5000);
    child.once("close", () => {
      clearTimeout(forceKill);
      resolve();
    });
  });
}

async function main(): Promise<void> {
  await mkdir(outputDirectory, { recursive: true });
  const child = startStorybook();
  const readStderr = collectStderr(child);
  let browser: Browser | undefined;
  try {
    await waitForStorybook(child, readStderr);
    browser = await chromium.launch({ headless: true }).catch((error: unknown) => {
      throw new Error(
        `Could not launch Chromium; run \`pnpm run test:browser-install\` first.\n${String(error)}`,
      );
    });
    for (const capture of captures) {
      await captureStory(browser, capture);
    }
    console.log(`Saved ${String(captures.length)} README screenshots to docs/images/readme/.`);
  } finally {
    await browser?.close();
    await stopStorybook(child);
  }
}

await main();
