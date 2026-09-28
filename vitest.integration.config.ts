import { defineConfig, mergeConfig } from "vitest/config";
import { createViteBase } from "./src/application/vite-base.ts";

export default mergeConfig(
  createViteBase(),
  defineConfig({
    test: {
      name: "integration",
      environment: "jsdom",
      include: ["src/**/*.test.tsx"],
      setupFiles: ["src/application/test/setup.ts"],
      clearMocks: true,
      restoreMocks: true,
    },
  }),
);
