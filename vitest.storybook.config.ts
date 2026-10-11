import { fileURLToPath, URL } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";
import { createViteBase } from "./src/application/vite-base.ts";

export default mergeConfig(
  createViteBase(),
  defineConfig({
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
              commands: {
                async resetPointer({ page }) {
                  await page.mouse.move(-1, -1);
                },
              },
              headless: true,
              screenshotFailures: false,
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
