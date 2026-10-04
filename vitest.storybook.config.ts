import { fileURLToPath, URL } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";
import { createViteBase } from "./src/application/vite-base.ts";

export default mergeConfig(
  createViteBase(),
  defineConfig({
    define: { __CONTRAST_EVIDENCE__: process.env["POPRAKO_CONTRAST_EVIDENCE"] === "1" },
    optimizeDeps: { include: ["apcach", "colorjs.io"] },
    test: {
      projects: [
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: fileURLToPath(new URL("./.storybook", import.meta.url)),
            }),
          ],
          test: {
            name: "storybook",
            browser: {
              enabled: true,
              headless: true,
              screenshotFailures: true,
              screenshotDirectory: "test-resource/generated/contrast/story-failures",
              provider: playwright({ contextOptions: { timezoneId: "Asia/Shanghai" } }),
              instances: [{ browser: "chromium" }],
            },
            setupFiles: [".storybook/vitest.setup.ts"],
          },
        },
      ],
    },
  }),
);
