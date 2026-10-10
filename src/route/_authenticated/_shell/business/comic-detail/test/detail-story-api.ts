import type { ApiUser } from "@/api/identity-contract";
import { createApiClient } from "@/api/client";
import type { ApiClient } from "@/api/client";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { UserInfo } from "@/route/business/identity/user";
import { toSnakeCase } from "@/shared/utility/case-convert";
import {
  required,
  ALL_CHAPTERS,
  makeAssignments,
  makePages,
  makeUser,
  now,
} from "./comic-detail-story-fixtures";
import { makeManyAssignments, makeWorkflowRecords, delay } from "./comic-detail-workflow-fixtures";
export type Scenario =
  | "default"
  | "many"
  | "empty"
  | "slow-assignment"
  | "admin"
  | "self"
  | "combined"
  | "empty-page"
  | "slow"
  | "completed"
  | "error"
  | "artwork"
  | "empty-workflow"
  | "workflow-error";
export const mutationLog: { method: string; path: string; body: unknown }[] = [];
function apiUser(user: UserInfo): ApiUser {
  const { name, qq, isSuperAdmin, ...other } = user;
  return { ...other, nickname: name, qid: qq, isSadmin: isSuperAdmin };
}

type AssignmentCache = Map<string, AssignmentInfo[]>;

function listAssignments(
  scenario: Scenario,
  assignments: AssignmentCache,
  chapterId: string,
): AssignmentInfo[] {
  let values = assignments.get(chapterId);
  if (values) return values;
  values =
    scenario === "empty"
      ? []
      : scenario === "many" || scenario === "admin"
        ? makeManyAssignments(chapterId)
        : makeAssignments(chapterId);
  if (["admin", "combined", "artwork"].includes(scenario)) {
    values = [
      ...values.filter((value) => value.userId !== "u-admin"),
      {
        id: "a-admin",
        chapterId,
        userId: "u-admin",
        user: makeUser("u-admin", "Mori"),
        roles: scenario === "artwork" ? 139 : 128,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }
  if (scenario === "combined") {
    values = [
      required(values[values.length - 1]),
      {
        id: "a-dual",
        chapterId,
        userId: "u-dual",
        user: makeUser("u-dual", "Dual Artist"),
        roles: 24,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }
  assignments.set(chapterId, values);
  return values;
}

function ok(value: unknown): Response {
  return Response.json({ code: 0, data: toSnakeCase(value) });
}

function updateAssignmentRoles(
  assignments: AssignmentCache,
  userId: string | undefined,
  body: unknown,
): void {
  if (
    typeof body !== "object" ||
    body === null ||
    !("roles" in body) ||
    typeof body.roles !== "number"
  )
    return;
  for (const values of assignments.values()) {
    for (const value of values) {
      if (value.userId === userId) value.roles = body.roles;
    }
  }
}

function removeDualAssignment(assignments: AssignmentCache): void {
  for (const [key, values] of assignments) {
    assignments.set(
      key,
      values.filter((value) => value.id !== "a-dual"),
    );
  }
}

function handleMutation(
  method: string,
  path: string,
  init: RequestInit | undefined,
  assignments: AssignmentCache,
): Response {
  const body: unknown = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
  mutationLog.push({ method, path, body });
  if (path.includes("/assignments/") && method === "PUT") {
    updateAssignmentRoles(assignments, path.split("/").at(-2), body);
  }
  if (method === "DELETE" && path.endsWith("/a-dual")) removeDualAssignment(assignments);
  return new Response(null, { status: 204 });
}

function chaptersResponse(scenario: Scenario, offset: number, limit: number): Response {
  if (scenario === "error")
    return Response.json({ code: 1, message: "网络连接失败" }, { status: 503 });
  return ok(
    ALL_CHAPTERS.slice(offset, offset + limit).map((chapter) => ({
      ...chapter,
      stages: scenario === "completed" ? 2730 : 6,
    })),
  );
}

async function assignmentsResponse(
  scenario: Scenario,
  assignments: AssignmentCache,
  url: URL,
): Promise<Response> {
  if (scenario === "slow-assignment") await delay(5000);
  return ok(
    listAssignments(scenario, assignments, url.searchParams.get("chapter_id") ?? "chapter-42").map(
      ({ user, ...value }) => ({ ...value, user: user ? apiUser(user) : null }),
    ),
  );
}

function issueResponse(scenario: Scenario): Response {
  const issues =
    scenario === "artwork"
      ? [0, 1].map((index) => ({
          id: "issue-" + String(index),
          pageArtworkId: "artwork-0",
          index,
          variant: "文字",
          layerName: null,
          rect: null,
          note: "需要修正",
        }))
      : [];
  return ok(issues);
}

function artworkResponse(scenario: Scenario, chapterId: string): Response {
  const pages =
    scenario === "empty-page"
      ? []
      : makePages(chapterId, 26).map((page, index) => ({
          ...page,
          id: "artwork-" + String(index),
          rawIdent: String(index + 1) + ".psd",
          imageHash: "hash",
          ext: "webp",
          imageVersion: 1,
          imageUploaded: true,
        }));
  return ok(pages);
}

function pagesResponse(scenario: Scenario, chapterId: string): Response {
  const pages =
    scenario === "empty-page"
      ? []
      : makePages(chapterId, 25).map((page) => ({ ...page, ext: "png", imageHash: null }));
  return ok(pages);
}

function workflowRecordsResponse(
  scenario: Scenario,
  chapterId: string,
  offset: number,
  limit: number,
): Response {
  if (scenario === "workflow-error")
    return Response.json({ code: 1, message: "网络连接失败" }, { status: 503 });
  const records =
    scenario === "empty-workflow"
      ? []
      : makeWorkflowRecords(chapterId).slice(offset, offset + limit);
  return ok(records);
}

function readResponse(
  scenario: Scenario,
  assignments: AssignmentCache,
  url: URL,
): Promise<Response> | Response {
  const { pathname: path, searchParams } = url;
  const offset = Number(searchParams.get("offset") ?? 0);
  const limit = Number(searchParams.get("limit") ?? 1000);
  if (path.endsWith("/chapters")) return chaptersResponse(scenario, offset, limit);
  if (path.endsWith("/assignments")) return assignmentsResponse(scenario, assignments, url);
  const chapterId = path.split("/")[4] ?? "chapter-42";
  if (path.endsWith("/issues")) return issueResponse(scenario);
  if (path.endsWith("/page-artworks")) return artworkResponse(scenario, chapterId);
  if (path.endsWith("/pages")) return pagesResponse(scenario, chapterId);
  if (path.endsWith("/workflow-records"))
    return workflowRecordsResponse(scenario, chapterId, offset, limit);
  if (path.includes("/users/"))
    return ok(apiUser(makeUser(path.split("/").at(-1) ?? "u-aki", "Aki")));
  return ok([]);
}

async function handleStoryRequest(
  scenario: Scenario,
  assignments: AssignmentCache,
  input: RequestInfo | URL,
  init: RequestInit | undefined,
): Promise<Response> {
  const address = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(address, "https://story.test");
  const method = init?.method ?? "GET";
  if (method !== "GET") return handleMutation(method, url.pathname, init, assignments);
  if (scenario === "slow") await delay(1000);
  return await readResponse(scenario, assignments, url);
}

export function createDetailStoryApi(scenario: Scenario): ApiClient {
  const assignments: AssignmentCache = new Map();
  return createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "story",
    fetchImpl: (input, init) => handleStoryRequest(scenario, assignments, input, init),
  });
}
