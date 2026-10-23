import { afterEach, expect, test, vi } from "vitest";
import type { ApiClient } from "@/api/client";
import * as worksetApi from "@/api/workset/workset-api";
import { useAppStore } from "@/route/business/session/session-store";
import { createTestApi } from "@/test-resource/api-client";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";
import {
  hasFreshWorksets,
  invalidateWorksets,
  readWorksetCache,
  trackWorksetRead,
  writeWorksetCache,
} from "./workset-cache";
import * as requests from "./workset-request";

type Mutation = "create" | "update" | "delete";

function workset(id: string, teamId = "team"): WorksetInfo {
  return {
    id,
    teamId,
    name: id,
    description: "",
    index: 0,
    comicCount: 0,
    createdAt: 0,
    updatedAt: 0,
  };
}

function deferMutation(kind: Mutation, promise: Promise<void>): void {
  if (kind === "create") {
    vi.spyOn(worksetApi, "createWorkset").mockImplementation(async () => {
      await promise;
      return { success: true, data: "created" };
    });
  } else {
    vi.spyOn(worksetApi, kind === "update" ? "updateWorkset" : "deleteWorkset").mockImplementation(
      async () => {
        await promise;
        return { success: true as const, data: undefined };
      },
    );
  }
}

function mutate(kind: Mutation, client: ApiClient): Promise<unknown> {
  if (kind === "create") return requests.createWorkset(client, { teamId: "team", name: "new" });
  if (kind === "update") return requests.updateWorkset(client, "one", { name: "changed" });
  return requests.deleteWorkset(client, "one");
}

afterEach(() => {
  vi.restoreAllMocks();
  useAppStore.getState().setAccessToken(null);
});

test.each<Mutation>(["create", "update", "delete"])(
  "a previous generation's %s cannot invalidate the new identity's cache",
  async (kind) => {
    useAppStore.getState().setAccessToken("old");
    const client = createTestApi();
    let complete!: () => void;
    const deferred = new Promise<void>((resolve) => {
      complete = resolve;
    });
    deferMutation(kind, deferred);
    const pending = mutate(kind, client);
    useAppStore.getState().setAccessToken("new");
    const scope = { client, generation: useAppStore.getState().generation, teamId: "team" };
    writeWorksetCache(scope, [workset("one"), workset("two")], "two");
    complete();
    await pending;
    expect(hasFreshWorksets(scope)).toBe(true);
    expect(readWorksetCache(scope)?.activeWorksetId).toBe("two");
    expect(readWorksetCache(scope)?.worksets).toHaveLength(2);
  },
);

test("successful creation invalidates only its team and preserves cached selection", async () => {
  useAppStore.getState().setAccessToken("token");
  const client = createTestApi();
  const scope = { client, generation: useAppStore.getState().generation, teamId: "team" };
  const other = { ...scope, teamId: "other" };
  writeWorksetCache(scope, [workset("one"), workset("two")], "two");
  writeWorksetCache(other, [workset("other", "other")], "other");
  vi.spyOn(worksetApi, "createWorkset").mockResolvedValue({ success: true, data: "created" });
  await requests.createWorkset(client, { teamId: "team", name: "new" });
  expect(hasFreshWorksets(scope)).toBe(false);
  expect(readWorksetCache(scope)?.activeWorksetId).toBe("two");
  expect(readWorksetCache(scope)?.worksets).toHaveLength(2);
  expect(hasFreshWorksets(other)).toBe(true);
});

test("invalidating a team revokes reads started before the mutation", () => {
  const scope = { client: createTestApi(), generation: 1, teamId: "team" };
  const before = trackWorksetRead(scope);
  invalidateWorksets(scope.client, scope.generation, scope.teamId);
  const after = trackWorksetRead(scope);
  expect(before()).toBe(false);
  expect(after()).toBe(true);
});
