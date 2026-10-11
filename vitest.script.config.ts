import { defineConfig } from "vitest/config";
import { VITEST_SCRIPT_INCLUDE } from "./script/test-runner-config.ts";

export default defineConfig({
  test: { name: "script", environment: "node", include: VITEST_SCRIPT_INCLUDE },
});
