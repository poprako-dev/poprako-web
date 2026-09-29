import { defineConfig, mergeConfig } from "vitest/config";
import { VITEST_INTEGRATION_INCLUDE } from "./script/test-runner-config.ts";
import { createViteBase } from "./src/application/vite-base.ts";

export default mergeConfig(
  createViteBase(),
  defineConfig({
    test: {
      name: "integration",
      environment: "jsdom",
      include: VITEST_INTEGRATION_INCLUDE,
      setupFiles: ["src/application/test/setup.ts"],
      clearMocks: true,
      restoreMocks: true,
    },
  }),
);
