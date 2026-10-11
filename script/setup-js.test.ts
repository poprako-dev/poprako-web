import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { promisify } from "node:util";
import { test } from "vitest";

const execute = promisify(execFile);

type InstallationFixture = { root: string; env: NodeJS.ProcessEnv; destination: string };

async function writeExecutable(path: string, content: string): Promise<void> {
  await writeFile(path, content);
  await chmod(path, 0o755);
}

async function archive(root: string, source: string, name: string): Promise<string> {
  const file = join(root, "downloads", name);
  await execute("tar", ["-czf", file, "-C", join(root, "payload"), source]);
  const hash = createHash("sha256")
    .update(await readFile(file))
    .digest("hex");
  return `${hash}  ${name}\n`;
}

async function prepareArchives(root: string): Promise<void> {
  const platform = process.platform;
  const node = `node-v${process.versions.node}-${platform}-${process.arch}`;
  await mkdir(join(root, "payload", node, "bin"), { recursive: true });
  await writeExecutable(
    join(root, "payload", node, "bin/node"),
    `#!/bin/sh\nexec '${process.execPath}' "$@"\n`,
  );
  await writeFile(join(root, "payload", node, "bin/npm"), "must not be extracted");
  await writeFile(join(root, "payload", node, "LICENSE"), "fixture license");
  await writeExecutable(join(root, "payload/pnpm"), "#!/bin/sh\nprintf '12.11.2\\n'\n");
  await writeFile(
    join(root, "downloads/SHASUMS256.txt"),
    await archive(root, node, `${node}.tar.gz`),
  );
  const sum = await archive(root, "pnpm", `pnpm-${platform}-${process.arch}.tar.gz`);
  await writeFile(join(root, "script/pnpm-12.11.2.sha256"), sum);
}

async function withFixture(run: (fixture: InstallationFixture) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "poprako-js-install-"));
  try {
    for (const directory of ["script", "bin", "downloads", "payload"]) {
      await mkdir(join(root, directory));
    }
    for (const source of [
      new URL("./setup-js.sh", import.meta.url),
      new URL("./assert-js-version.sh", import.meta.url),
    ]) {
      await copyFile(source, join(root, "script", basename(source.pathname)));
    }
    await writeFile(join(root, ".node-version"), `${process.versions.node}\n`);
    await writeFile(join(root, "package.json"), '{"packageManager": "pnpm@12.11.2"}\n');
    await prepareArchives(root);
    await writeExecutable(
      join(root, "bin/curl"),
      `#!/bin/sh
while [ "$#" -gt 0 ]; do
  case "$1" in
    https://*) source="$1" ;;
    -o) shift; destination="$1" ;;
  esac
  shift
done
cp "$FIXTURE_DOWNLOADS/\${source##*/}" "$destination"
`,
    );
    const env = {
      ...process.env,
      PATH: `${root}/bin:${process.env["PATH"] ?? ""}`,
      FIXTURE_DOWNLOADS: join(root, "downloads"),
      GITHUB_PATH: join(root, "github-path"),
    };
    await run({ root, env, destination: join(root, "installation") });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function install({ root, env, destination }: InstallationFixture): Promise<unknown> {
  return execute("sh", [join(root, "script/setup-js.sh"), destination], { env });
}

test("installer verifies archives and extracts independent tools without bundled npm", async () => {
  await withFixture(async (fixture) => {
    await install(fixture);
    const nodeBin = join(fixture.destination, `node-${process.versions.node}/bin`);
    assert.deepEqual(await readdir(nodeBin), ["node"]);
    assert.deepEqual(await readdir(join(fixture.destination, "pnpm-12.11.2")), ["pnpm"]);
    assert.equal(
      await readFile(join(fixture.root, "github-path"), "utf8"),
      `${nodeBin}\n${fixture.destination}/pnpm-12.11.2\n`,
    );
    await assert.rejects(install(fixture), /existing tools are never overwritten/u);
  });
});

test("installer rejects corrupted downloads before extracting tools", async () => {
  await withFixture(async (fixture) => {
    const checksum = join(fixture.root, "downloads/SHASUMS256.txt");
    await writeFile(
      checksum,
      (await readFile(checksum, "utf8")).replace(/^[a-f0-9]{64}/u, "0".repeat(64)),
    );
    await assert.rejects(install(fixture), /checksum|FAILED/u);
  });
});
