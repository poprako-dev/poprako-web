import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import { VITEST_UNIT_INCLUDE } from "./script/test-runner-config.ts";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    name: "unit",
    environment: "node",
    setupFiles: ["src/test-resource/storage.ts"],
    include: VITEST_UNIT_INCLUDE,
  },
});
