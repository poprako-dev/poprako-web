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
export function createDetailStoryApi(scenario: Scenario): ApiClient {
  const assignments = new Map<string, AssignmentInfo[]>();
  function list(chapterId: string): AssignmentInfo[] {
    let values = assignments.get(chapterId);
    if (values) return values;
    values =
      scenario === "empty"
        ? []
        : scenario === "many" || scenario === "admin"
          ? makeManyAssignments(chapterId)
          : makeAssignments(chapterId);
    if (["admin", "combined", "artwork"].includes(scenario))
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
    if (scenario === "combined")
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
    assignments.set(chapterId, values);
    return values;
  }
  return createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "story",
    fetchImpl: async (input, init) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
        "https://story.test",
      );
      const path = url.pathname;
      const method = init?.method ?? "GET";
      const ok = (value: unknown): Response => Response.json({ code: 0, data: toSnakeCase(value) });
      if (method !== "GET") {
        const body: unknown = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
        mutationLog.push({ method, path, body });
        if (path.includes("/assignments/") && method === "PUT") {
          const userId = path.split("/").at(-2);
          for (const values of assignments.values())
            for (const value of values)
              if (
                value.userId === userId &&
                typeof body === "object" &&
                body !== null &&
                "roles" in body &&
                typeof body.roles === "number"
              )
                value.roles = body.roles;
          return new Response(null, { status: 204 });
        }
        if (method === "DELETE" && path.endsWith("/a-dual"))
          for (const [key, values] of assignments)
            assignments.set(
              key,
              values.filter((value) => value.id !== "a-dual"),
            );
        return new Response(null, { status: 204 });
      }
      if (scenario === "slow") await delay(1000);
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const limit = Number(url.searchParams.get("limit") ?? 1000);
      if (path.endsWith("/chapters")) {
        if (scenario === "error")
          return Response.json({ code: 1, message: "网络连接失败" }, { status: 503 });
        return ok(
          ALL_CHAPTERS.slice(offset, offset + limit).map((ch) => ({
            ...ch,
            stages: scenario === "completed" ? 2730 : 6,
          })),
        );
      }
      if (path.endsWith("/assignments")) {
        if (scenario === "slow-assignment") await delay(5000);
        return ok(
          list(url.searchParams.get("chapter_id") ?? "chapter-42").map(({ user, ...value }) => ({
            ...value,
            user: user ? apiUser(user) : null,
          })),
        );
      }
      const chapterId = path.split("/")[4] ?? "chapter-42";
      if (path.endsWith("/pages"))
        return ok(
          scenario === "empty-page"
            ? []
            : makePages(chapterId, 25).map((value) => ({ ...value, ext: "png", imageHash: null })),
        );
      if (path.endsWith("/workflow-records")) {
        if (scenario === "workflow-error")
          return Response.json({ code: 1, message: "网络连接失败" }, { status: 503 });
        return ok(
          scenario === "empty-workflow"
            ? []
            : makeWorkflowRecords(chapterId).slice(offset, offset + limit),
        );
      }
      if (path.includes("/users/"))
        return ok(apiUser(makeUser(path.split("/").at(-1) ?? "u-aki", "Aki")));
      if (path.endsWith("/members")) return ok([]);
      return ok([]);
    },
  });
}
