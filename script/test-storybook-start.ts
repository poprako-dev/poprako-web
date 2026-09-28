const command = new Deno.Command(Deno.execPath(), {
  args: ["task", "storybook", "--ci", "--no-open", "--disable-telemetry", "--port", "6006"],
  cwd: new URL("../", import.meta.url),
  stdout: "piped",
  stderr: "piped",
});

const child = command.spawn();
const stdoutPromise = new Response(child.stdout).text();
const stderrPromise = new Response(child.stderr).text();
let exited = false;
function hasExited(): boolean {
  return exited;
}
const statusPromise = child.status.then((status) => {
  exited = true;
  return status;
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
      `Storybook did not serve /iframe.html (${String(status.code)}).\n${stdout}\n${stderr}`,
    );
  }
  console.log("Storybook HTTP startup smoke passed.");
} finally {
  clearTimeout(timeout);
  if (!hasExited()) child.kill("SIGTERM");
  await statusPromise;
}
