import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { createViteBase } from "../src/application/vite-base.ts";

export async function startUndoBrowserFixture(fixtureHtml: string): Promise<{
  url: string;
  close: () => Promise<void>;
}> {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const generated = `${root}/test-resource/generated/translator-undo`;
  await mkdir(generated, { recursive: true });
  await writeFile(`${generated}/index.html`, fixtureHtml);
  const server = await createServer({
    ...createViteBase(false),
    configFile: false,
    root,
    server: { host: "127.0.0.1", port: 4187, strictPort: true },
    logLevel: "warn",
  });
  await server.listen();
  return {
    url: "http://127.0.0.1:4187/test-resource/generated/translator-undo/index.html",
    close: () => server.close(),
  };
}
