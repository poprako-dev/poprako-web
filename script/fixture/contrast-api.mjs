import { toSnakeCase } from "../../src/shared/utility/case-convert.ts";

export const fixedTime = Date.UTC(2026, 9, 3, 4);
const timestamps = { createdAt: fixedTime, updatedAt: fixedTime };
const user = {
  id: "user-1",
  qid: "12345678",
  nickname: "Mori",
  avatarUrl: null,
  isSadmin: false,
  lastActiveAt: fixedTime,
  ...timestamps,
};
const team = {
  id: "team-1",
  name: "PopRaKo 汉化组",
  description: "让好故事被更多人读到",
  avatarUrl: null,
  ...timestamps,
};
const workset = {
  id: "ws-1",
  teamId: team.id,
  team,
  name: "连载作品",
  description: "每周更新",
  index: 0,
  comicCount: 1,
  ...timestamps,
};
const comic = {
  id: "comic-1",
  worksetId: workset.id,
  workset,
  team,
  title: "深渊回响",
  author: "Mori",
  description: "一次关于勇气的旅程",
  index: 0,
  chapterCount: 2,
  coverUrl: "/__contrast/white.svg",
  coverThumbnailUrl: "/__contrast/white.svg",
  creatorId: user.id,
  creator: user,
  isArchived: false,
  lastActiveAt: fixedTime,
  ...timestamps,
};
const chapters = [1, 2].map((index) => ({
  id: `chapter-${index}`,
  comicId: comic.id,
  comic,
  creatorId: user.id,
  creator: user,
  index,
  subtitle: "新的开始",
  pageCount: 2,
  totalUnitCount: 2,
  translatedUnitCount: 1,
  proofreadUnitCount: 0,
  isPinned: index === 1,
  stages: 6,
  ...timestamps,
}));
const pages = [1, 2].map((index) => ({
  id: `page-${index}`,
  chapterId: "chapter-1",
  index: index - 1,
  imageUrl: `/__contrast/${index === 1 ? "white" : "black"}.svg`,
  imageThumbnailUrl: `/__contrast/${index === 1 ? "white" : "black"}.svg`,
  imageOptimizedUrl: `/__contrast/${index === 1 ? "white" : "black"}.svg`,
  ext: "svg",
  totalUnitCount: 2,
  translatedUnitCount: 1,
  proofreadUnitCount: 0,
  ...timestamps,
}));
const units = [0, 1].map((index) => ({
  id: `unit-${index}`,
  pageId: "page-1",
  xCoord: 0.35 + index * 0.2,
  yCoord: 0.3 + index * 0.2,
  isBubble: index === 0,
  isFlagged: index === 1,
  translatedText: index === 0 ? "你好，世界。" : null,
  lastTranslatorId: user.id,
  isProofread: false,
  proofreadText: null,
  ...timestamps,
}));

/** No requests reach a real backend. Unknown endpoints are errors, never empty successes.
 * @param {import("playwright").Page} page
 * @param {"admin" | "member" | "no-team"} identity
 * @param {"ready" | "empty" | "error" | "loading"} initialMode @param {boolean} photos
 */
export async function mockContrastApi(
  page,
  identity = "admin",
  initialMode = "ready",
  photos = false,
) {
  let mode = initialMode;
  const unknown = /** @type {string[]} */ ([]);
  const profile = photos ? { ...user, avatarUrl: "/__contrast/white.svg" } : user;
  const group = photos ? { ...team, avatarUrl: "/__contrast/white.svg" } : team;
  const member = {
    id: "member-1",
    userId: user.id,
    teamId: team.id,
    user: profile,
    team: group,
    nickname: user.nickname,
    lastActiveAt: fixedTime,
    roles: identity === "admin" ? 255 : 8,
  };
  await page.addInitScript(
    ({ hasTeam }) => {
      localStorage.setItem(
        "app-store",
        JSON.stringify({
          state: { accessToken: "contrast-fixture", selectedTeamId: hasTeam ? "team-1" : null },
          version: 0,
        }),
      );
      localStorage.setItem("poprako:first-registration", "true");
    },
    { hasTeam: identity !== "no-team" },
  );
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api\/v1/, "");
    if (
      url.pathname.startsWith("/__contrast/") ||
      (request.resourceType() === "image" && !url.hostname.includes("127.0.0.1"))
    ) {
      const fill = url.pathname.includes("black") ? "black" : "white";
      return route.fulfill({
        contentType: "image/svg+xml",
        body: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="${fill}"/></svg>`,
      });
    }
    if (!url.pathname.startsWith("/api/")) {
      if (url.hostname === "127.0.0.1") return route.continue();
      unknown.push(request.url());
      return route.abort();
    }
    /** @param {unknown} data */
    const ok = (data) => route.fulfill({ json: { code: 0, data: toSnakeCase(data) } });
    const error = () =>
      route.fulfill({ status: 503, json: { code: 1, message: "测试网络失败，请重试" } });
    if (path === "/users/me") return ok(profile);
    if (path === "/members/me") return ok(identity === "no-team" ? [] : [member]);
    if (path.endsWith("/mark-self-online")) return route.fulfill({ status: 204 });
    if (path.endsWith("/online-users")) return ok([user.id]);
    if (path === "/auth/login" || path === "/auth/register") {
      if (mode === "loading") await new Promise((resolve) => setTimeout(resolve, 1500));
      return mode === "error" ? error() : ok({ token: "contrast-fixture", userId: user.id });
    }
    if (request.method() !== "GET") {
      unknown.push(`${request.method()} ${url.pathname}`);
      return route.fulfill({ status: 500, json: { code: 1, message: "未声明的测试请求" } });
    }
    if (mode === "loading") await new Promise((resolve) => setTimeout(resolve, 1500));
    if (mode === "error") return error();
    /** @param {unknown[]} data */
    const list = (data) =>
      ok(
        mode === "empty"
          ? []
          : data.slice(
              Number(url.searchParams.get("offset") ?? 0),
              Number(url.searchParams.get("offset") ?? 0) +
                Number(url.searchParams.get("limit") ?? 100),
            ),
      );
    if (path === "/members") return list([member]);
    if (path === "/teams") return list([group]);
    if (path.startsWith("/users/")) return ok(profile);
    if (/^\/teams\/[^/]+$/.test(path)) return ok(group);
    if (path.endsWith("/worksets")) return list([workset]);
    if (/^\/worksets\/[^/]+$/.test(path)) return ok(workset);
    if (path.endsWith("/comics"))
      return ok({
        comics: mode === "empty" ? [] : [comic],
        pinnedChapters: mode === "empty" ? [] : [chapters[0]],
        pinnedChapterAssignments: mode === "empty" ? [] : [[]],
      });
    if (/^\/comics\/[^/]+$/.test(path)) return ok(comic);
    if (path.endsWith("/chapters/pinned")) return ok(mode === "empty" ? null : chapters[0]);
    if (path.endsWith("/chapters")) return list(chapters);
    if (/^\/chapters\/[^/]+$/.test(path)) return ok(chapters[0]);
    if (path === "/assignments")
      return list([
        {
          id: "assignment-1",
          chapterId: "chapter-1",
          chapter: chapters[0],
          userId: user.id,
          user,
          roles: 255,
          ...timestamps,
        },
      ]);
    if (path.endsWith("/pages")) return list(pages);
    if (/^\/pages\/[^/]+$/.test(path)) {
      const found = pages.find((item) => path.endsWith(`/${item.id}`));
      if (found) return ok(found);
    }
    if (path.endsWith("/units"))
      return ok({
        totalUnitCount: 2,
        translatedUnitCount: 1,
        proofreadUnitCount: 0,
        unitInfos: mode === "empty" ? [] : units,
      });
    if (path.endsWith("/unit-flagged-stats"))
      return ok(pages.map((p) => ({ pageId: p.id, index: p.index, flaggedUnitCount: 1 })));
    if (path.endsWith("/unit-diff-stats"))
      return ok(
        pages.map((p) => ({
          pageId: p.id,
          index: p.index,
          translatedUnitCount: 1,
          edittedUnitCount: 0,
          proofreaderAppendUnitCount: 0,
        })),
      );
    if (path.endsWith("/comments"))
      return list([
        {
          id: "comment-1",
          teamId: team.id,
          userId: user.id,
          user,
          content: "本周的翻译任务已经准备好了。",
          ...timestamps,
        },
      ]);
    if (path.endsWith("/announcements"))
      return list([
        {
          id: "announcement-1",
          teamId: team.id,
          userId: user.id,
          user,
          title: "每周任务",
          content: "欢迎来到工作区",
          ...timestamps,
        },
      ]);
    if (path === "/system-mails")
      return list([
        {
          id: "mail-1",
          title: "任务更新",
          content: "请查看新的章节安排。",
          isRead: false,
          createdAt: fixedTime,
        },
      ]);
    if (/\/(termbases|workflow-records|invitations)$/.test(path)) return ok([]);
    unknown.push(`${request.method()} ${url.pathname}`);
    return route.fulfill({ status: 500, json: { code: 1, message: "未声明的测试请求" } });
  });
  /** @param {typeof initialMode} next */
  function setMode(next) {
    mode = next;
  }
  return { unknown, setMode };
}
