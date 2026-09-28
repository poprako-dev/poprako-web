import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig, mergeConfig } from "vite";
import { routeConfiguration } from "./script/route-config.ts";
import { createViteBase } from "./src/application/vite-base.ts";
import { routeBundleGuard } from "./script/check-route-bundle.ts";

const { plugins, ...base } = createViteBase();

export default mergeConfig(
  base,
  defineConfig({
    plugins: [tanstackRouter(routeConfiguration), ...(plugins ?? []), routeBundleGuard()],
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:8888/api",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/u, ""),
        },
      },
    },
  }),
);
