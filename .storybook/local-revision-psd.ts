import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

/** Serve the local benchmark fixture without copying gigabytes into Storybook builds. */
export function localRevisionPsd(): Plugin {
  const root = resolve("test-resource/generated/revision-performance-rar");
  return {
    name: "local-revision-psd",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__revision-psd__", (request, response) => {
        void serve().catch(() => {
          if (response.headersSent) response.destroy();
          else {
            response.statusCode = 404;
            response.end("Local PSD fixture unavailable. Prepare revision-performance-rar first.");
          }
        });
        async function serve(): Promise<void> {
          const pathname = decodeURIComponent((request.url ?? "").split("?")[0] ?? "");
          const manifest = pathname === "/manifest.json";
          if (!manifest && !/^\/_\d{3} ?\.psd$/u.test(pathname)) {
            response.statusCode = 404;
            response.end();
            return;
          }
          const path = manifest
            ? resolve(root, "manifest.json")
            : resolve(root, "extracted/psd", pathname.slice(1));
          const info = await stat(path);
          response.setHeader(
            "Content-Type",
            manifest ? "application/json" : "application/octet-stream",
          );
          response.setHeader("Content-Length", info.size);
          response.setHeader("Cache-Control", "no-store");
          const stream = createReadStream(path);
          response.on("close", () => stream.destroy());
          stream.on("error", () => response.destroy());
          stream.pipe(response);
        }
      });
    },
  };
}
