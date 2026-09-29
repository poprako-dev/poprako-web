import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import type { UserConfig } from "vite";

export function createViteBase(includeReact = true): UserConfig {
  return {
    plugins: includeReact ? [react()] : [],
    resolve: {
      alias: { "@": fileURLToPath(new URL("../", import.meta.url)) },
    },
    optimizeDeps: {
      include: ["@zip.js/zip.js", "modern-tar"],
      // The archive Worker needs a stable direct ESM URL during dependency optimization.
      exclude: ["node-liblzma"],
    },
    build: {
      target: ["chrome111", "safari16.4"],
      cssTarget: ["chrome111", "safari16.4"],
    },
  };
}
