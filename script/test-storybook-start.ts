import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { text } from "node:stream/consumers";

const require = createRequire(import.meta.url);
const cli = join(dirname(require.resolve("storybook/package.json")), "dist/bin/dispatcher.js");
const child = spawn(
  process.execPath,
  [cli, "dev", "--ci", "--no-open", "--disable-telemetry", "--port", "6006"],
  { cwd: new URL("../", import.meta.url), stdio: ["ignore", "pipe", "pipe"] },
);
const stdoutPromise = text(child.stdout);
const stderrPromise = text(child.stderr);
let exited = false;
function hasExited(): boolean {
  return exited;
}
const statusPromise = new Promise<number | null>((resolve, reject) => {
  child.once("error", reject);
  child.once("close", (code) => {
    exited = true;
    resolve(code);
  });
});
const timeout = setTimeout(() => {
  child.kill("SIGTERM");
}, 60_000);
try {
  let response: Response | undefined;
  const deadline = Date.now() + 55_000;
  while (Date.now() < deadline && !hasExited()) {
    try {
      response = await fetch("http://127.0.0.1:6006/iframe.html");
      if (response.ok) break;
    } catch {
      // Keep waiting while Storybook starts its preview server.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!response?.ok) {
    if (!hasExited()) child.kill("SIGTERM");
    const status = await statusPromise;
    const [stdout, stderr] = await Promise.all([stdoutPromise, stderrPromise]);
    throw new Error(
      `Storybook did not serve /iframe.html (${String(status)}).\n${stdout}\n${stderr}`,
    );
  }
  console.log("Storybook HTTP startup smoke passed.");
} finally {
  clearTimeout(timeout);
  if (!hasExited()) child.kill("SIGTERM");
  await statusPromise;
}
