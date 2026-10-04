import path from "node:path";

/** Capture the PR base using the current fixtures/auditor without mutating the checkout.
 * @param {string} root @param {string} commit
 * @param {(args: string[], name: string) => Promise<{success: boolean, log: string}>} runCheck
 */
export async function captureReference(root, commit, runCheck) {
  if (!/^[a-f0-9]{40}$/.test(commit))
    throw new Error("Contrast reference must be a full commit SHA");
  const directory = await Deno.makeTempDir({ prefix: "poprako-contrast-reference-" });
  try {
    const archive = await new Deno.Command("git", {
      args: ["archive", "--format=tar", commit],
      cwd: root,
      stdout: "piped",
      stderr: "piped",
    }).output();
    if (!archive.success) throw new Error(new TextDecoder().decode(archive.stderr));
    const archivePath = path.join(directory, "source.tar");
    await Deno.writeFile(archivePath, archive.stdout);
    const extracted = await new Deno.Command("tar", {
      args: ["-xf", archivePath, "-C", directory],
      stdout: "piped",
      stderr: "piped",
    }).output();
    if (!extracted.success) throw new Error(new TextDecoder().decode(extracted.stderr));
    await Deno.symlink(path.join(root, "node_modules"), path.join(directory, "node_modules"), {
      type: "dir",
    });
    const result = await runCheck(
      [
        "run",
        "-A",
        "script/test-contrast-browser.mjs",
        "--capture",
        "--reference-source",
        directory,
      ],
      "reference",
    );
    if (!result.success)
      throw new Error("Reference capture failed; inspect contrast/reference.log");
    const report = JSON.parse(
      await Deno.readTextFile(
        path.join(root, "test-resource/generated/contrast/reference/report.json"),
      ),
    );
    if (!report.reports?.length || report.setupErrors?.length || report.fatal)
      throw new Error("Reference capture has incomplete states or setup errors");
    console.log(`Contrast reference: ${commit}; screenshots and measurements captured`);
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
}
