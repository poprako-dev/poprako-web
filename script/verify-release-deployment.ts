import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execute = promisify(execFile);

type ReadApi = (endpoint: string) => Promise<unknown>;
type RecordValue = Record<string, unknown>;

function recordsFromPages(value: unknown): RecordValue[] {
  if (!Array.isArray(value) || !value.every(Array.isArray)) {
    throw new Error("GitHub deployment API returned invalid pages");
  }
  const records: unknown[] = value.flat();
  return records.map((record) => {
    if (typeof record !== "object" || record === null || Array.isArray(record)) {
      throw new Error("GitHub deployment API returned an invalid record");
    }
    return record as RecordValue;
  });
}

async function readGitHubPages(endpoint: string): Promise<unknown> {
  const { stdout } = await execute("gh", [
    "api",
    "--method",
    "GET",
    "--paginate",
    "--slurp",
    "-H",
    "Accept: application/vnd.github+json",
    "-H",
    "X-GitHub-Api-Version: 2026-03-10",
    endpoint,
  ]);
  return JSON.parse(stdout) as unknown;
}

export async function verifyReleaseDeployment(
  repository: string,
  sha: string,
  readApi: ReadApi = readGitHubPages,
): Promise<void> {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error("GITHUB_REPOSITORY must identify the current owner/repository");
  }
  if (!/^[0-9a-f]{40}$/.test(sha)) {
    throw new Error("Release commit must be a full lowercase commit SHA");
  }
  const base = `repos/${repository}/deployments`;
  const deployments = recordsFromPages(
    await readApi(`${base}?sha=${sha}&environment=production&per_page=100`),
  );
  for (const deployment of deployments) {
    if (deployment["sha"] !== sha || deployment["environment"] !== "production") {
      continue;
    }
    const id = deployment["id"];
    if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
      throw new Error("GitHub deployment API returned an invalid deployment ID");
    }
    const statuses = recordsFromPages(await readApi(`${base}/${String(id)}/statuses?per_page=100`));
    if (
      statuses.some(
        (status) => status["state"] === "success" && status["environment"] === "production",
      )
    ) {
      return;
    }
  }
  throw new Error(`No successful production deployment found for ${repository}@${sha}`);
}

if (import.meta.main) {
  await verifyReleaseDeployment(process.env["GITHUB_REPOSITORY"] ?? "", process.argv[2] ?? "");
}
