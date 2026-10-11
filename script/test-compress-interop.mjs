// node script/test-compress-interop.mjs
import { runArchive } from "../src/shared/utility/compress/core.ts";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Writable } from "node:stream";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";

const exec = promisify(execFile);
const directory = fileURLToPath(new URL("../test-resource/generated/", import.meta.url));
await mkdir(directory, { recursive: true });
const bytes = Uint8Array.from({ length: 256 * 1024 }, (_, index) => index % 251);
await writeFile(path.join(directory, "interop.bin"), bytes);
const options = { preset: 3, maxFiles: 1000, maxBytes: 8 * 1024 ** 3 };
const name = `中文目录/${"很长的文件名".repeat(30)}.psd`;
await runArchive(
  {
    ...options,
    operation: "compress",
    files: [{ name, blob: new Blob([bytes]) }],
  },
  Writable.toWeb(createWriteStream(path.join(directory, "interop.tar.zst"))),
  () => {},
);
await exec("tar", ["-cf", path.join(directory, "native.tar"), "-C", directory, "interop.bin"]);
await exec("zstd", [
  "-f",
  "-3",
  "--long=28",
  path.join(directory, "native.tar"),
  "-o",
  path.join(directory, "native.tar.zst"),
]);
await exec("zstd", [
  "-f",
  "-d",
  "--long=28",
  path.join(directory, "interop.tar.zst"),
  "-o",
  path.join(directory, "interop.tar"),
]);
const native = new Blob([await readFile(path.join(directory, "native.tar.zst"))]);
await runArchive(
  {
    ...options,
    operation: "decompress",
    files: [],
    source: native.stream(),
  },
  Writable.toWeb(createWriteStream(path.join(directory, "native.zip"))),
  () => {},
);
const { stdout } = await exec("uv", [
  "run",
  "--no-project",
  "python",
  "-c",
  `
import tarfile, zipfile, hashlib, pathlib, sys, json
root = pathlib.Path(sys.argv[1])
expected = (root / 'interop.bin').read_bytes()
with tarfile.open(root / 'interop.tar', 'r:') as archive:
    members = archive.getmembers()
    assert len(members) == 1
    assert members[0].name == sys.argv[2]
    assert archive.extractfile(members[0]).read() == expected
with zipfile.ZipFile(root / 'native.zip') as archive:
    assert archive.read('interop.bin') == expected
    assert archive.testzip() is None
print(json.dumps({'nativeTarReadsWasmZst': True, 'wasmReadsNativeTarZst': True,
    'pythonReadsZip64': True, 'longUnicodePath': True,
    'sha256': hashlib.sha256(expected).hexdigest()}, indent=2))
`,
  directory,
  name,
]);
await writeFile(path.join(directory, "interop-report.json"), stdout);
console.log(stdout);
