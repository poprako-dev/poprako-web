import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "vitest";
import { verifyReleaseDeployment } from "./verify-release-deployment.ts";

const repository = "poprako-dev/poprako-web";
const sha = "a".repeat(40);
const base = `repos/${repository}/deployments`;
const query = `${base}?sha=${sha}&environment=production&per_page=100`;
const deployment = { id: 42, sha, environment: "production" };
const success = { state: "success", environment: "production" };

test("release gate searches deployment and status pages for historical success", async () => {
  const calls: string[] = [];
  await verifyReleaseDeployment(repository, sha, (endpoint) => {
    calls.push(endpoint);
    return Promise.resolve(
      endpoint === query
        ? [[{ ...deployment, id: 1 }], [deployment]]
        : endpoint.includes("/1/statuses")
          ? [[{ state: "failure", environment: "production" }]]
          : [[{ state: "inactive", environment: "production" }], [success]],
    );
  });
  assert.deepEqual(calls, [
    query,
    `${base}/1/statuses?per_page=100`,
    `${base}/42/statuses?per_page=100`,
  ]);
});

for (const candidate of [
  { ...deployment, sha: "b".repeat(40) },
  { ...deployment, environment: "staging" },
]) {
  test(`release rejects deployment with wrong ${candidate.sha === sha ? "environment" : "SHA"}`, async () => {
    await assert.rejects(
      verifyReleaseDeployment(repository, sha, (endpoint) => {
        assert.equal(endpoint, query);
        return Promise.resolve([[candidate]]);
      }),
      /No successful production deployment/,
    );
  });
}

for (const statuses of [
  [],
  [{ state: "failure", environment: "production" }],
  [{ state: "pending", environment: "production" }],
  [{ state: "success", environment: "staging" }],
]) {
  test(`release rejects statuses ${JSON.stringify(statuses)}`, async () => {
    await assert.rejects(
      verifyReleaseDeployment(repository, sha, (endpoint) =>
        Promise.resolve(endpoint === query ? [[deployment]] : [statuses]),
      ),
      /No successful production deployment/,
    );
  });
}

test("release rejects a SHA without any deployment", async () => {
  await assert.rejects(
    verifyReleaseDeployment(repository, sha, () => Promise.resolve([[]])),
    /No successful production deployment/,
  );
});

for (const failingEndpoint of [query, `${base}/42/statuses?per_page=100`]) {
  test(`release fails closed on API errors at ${failingEndpoint}`, async () => {
    await assert.rejects(
      verifyReleaseDeployment(repository, sha, (endpoint) => {
        if (endpoint === failingEndpoint) {
          return Promise.reject(new Error("GitHub API denied access"));
        }
        return Promise.resolve([[deployment]]);
      }),
      /GitHub API denied access/,
    );
  });
}

for (const malformed of [{ message: "rate limited" }, [null], [[null]]]) {
  test(`release fails closed on malformed response ${JSON.stringify(malformed)}`, async () => {
    await assert.rejects(
      verifyReleaseDeployment(repository, sha, () => Promise.resolve(malformed)),
      /GitHub deployment API returned/,
    );
  });
}

test("release rejects invalid repository and abbreviated SHA before API calls", async () => {
  const unexpectedApi = (): Promise<never> => {
    return Promise.reject(new Error("API must not be called"));
  };
  await assert.rejects(verifyReleaseDeployment("", sha, unexpectedApi), /GITHUB_REPOSITORY/);
  await assert.rejects(verifyReleaseDeployment(repository, "abc", unexpectedApi), /full/);
});

test("release workflow injects production API configuration into the dist build", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8",
  );
  assert.match(
    workflow,
    /name: Run required checks\n\s+env:\n\s+VITE_API_BASE_URL: https:\/\/api\.poprako\.com\/api\/v1\n\s+run: sh script\/ci-check\.sh/,
  );
  assert.match(workflow, /deployments: read/);
  assert.match(workflow, /node script\/verify-release-deployment\.ts "\$GITHUB_SHA"/);
  assert.ok(
    workflow.indexOf("Verify successful production deployment") <
      workflow.indexOf("Run required checks"),
  );
});
