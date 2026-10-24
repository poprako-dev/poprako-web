import { deferred } from "@/test-resource/deferred";
import { expect, test, vi } from "vitest";
import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";
import { ReviewMemorySource, type ReviewScenario } from "../test/review-memory-source";
import { ReviewSession } from "./review-session";
import { pageIsDirty } from "./review-editing";

const issue: IssueInfo = {
  id: "a",
  pageArtworkId: "page-1",
  index: 0,
  variant: "文字位置",
  note: "原文",
  rect: { xCoord: 0.1, yCoord: 0.2, width: 0.2, height: 0.1 },
};
async function setup(
  scenario: ReviewScenario = "normal",
): Promise<{ source: ReviewMemorySource; session: ReviewSession }> {
  const source = new ReviewMemorySource(() => Promise.resolve([structuredClone(issue)]), scenario);
  const session = new ReviewSession(source);
  await session.load("page-1", new AbortController().signal);
  return { source, session };
}

function edit(session: ReviewSession, note: string): void {
  session.commit(
    "page-1",
    session.page("page-1").issues.map((item) => ({ ...item, note })),
  );
}

test("merges unchanged fields from remote, keeps local note and undo preserves remote fields", async () => {
  const { session } = await setup("remote-change");
  edit(session, "本地说明");
  await session.save("page-1");
  expect(session.page("page-1").issues[0]).toMatchObject({
    note: "本地说明",
    variant: "字号",
  });
  session.undo("page-1");
  expect(session.page("page-1").issues[0]).toMatchObject({ note: "原文", variant: "字号" });
  expect(pageIsDirty(session.page("page-1"))).toBe(true);
});

test("retains a locally edited issue deleted remotely", async () => {
  const { session, source } = await setup("remote-delete");
  edit(session, "保留说明");
  await session.save("page-1");
  expect(source.documents.get("page-1")?.issues).toHaveLength(1);
  expect(session.page("page-1").issues[0]?.note).toBe("保留说明");
});

test("lost acknowledgement keeps request identity across session recovery without duplicate creation", async () => {
  const { session, source } = await setup("lost-response");
  session.commit("page-1", [...session.page("page-1").issues, { ...issue, id: "new", index: 1 }]);
  await expect(session.save("page-1")).rejects.toThrow("未收到保存结果");
  edit(session, "保存响应丢失后继续编辑");
  await session.retain("page-1");
  const recovered = new ReviewSession(source);
  await recovered.load("page-1", new AbortController().signal);
  await recovered.save("page-1");
  expect(source.saves[0]?.saveId).toBe(source.saves[1]?.saveId);
  expect(source.documents.get("page-1")?.issues.map((item) => item.id)).toEqual(["a", "new"]);
  expect(source.drafts.size).toBe(0);
  expect(source.documents.get("page-1")?.issues[1]?.note).toBe("保存响应丢失后继续编辑");
});

test("an edit made while saving survives acknowledgement and is flushed", async () => {
  const { session, source } = await setup();
  const original = source.save.bind(source);
  const gate = deferred<undefined>();
  const entered = deferred<undefined>();
  vi.spyOn(source, "save").mockImplementation(async (...args) => {
    entered.resolve(undefined);
    await gate.promise;
    return original(...args);
  });
  edit(session, "第一版");
  const saving = session.save("page-1");
  await entered.promise;
  edit(session, "继续输入");
  gate.resolve(undefined);
  await saving;
  expect(source.documents.get("page-1")?.issues[0]?.note).toBe("继续输入");
  expect(pageIsDirty(session.page("page-1"))).toBe(false);
});

test("whole review replacement blocks saving and cannot resurrect old issues", async () => {
  const { session, source } = await setup("import");
  edit(session, "旧修改");
  await expect(session.save("page-1")).rejects.toThrow("请先核对");
  expect(session.page("page-1").blocked?.reviewKey).toBe("review-2");
  expect(session.page("page-1").issues[0]?.note).toBe("旧修改");
  session.resolve("page-1", true);
  await session.save("page-1");
  expect(source.documents.get("page-1")?.issues).toEqual([]);
});

test("image replacement pauses edits until the retained rectangles are acknowledged", async () => {
  const { session } = await setup("image");
  edit(session, "检查位置");
  await expect(session.save("page-1")).rejects.toThrow("请先核对");
  session.resolve("page-1", true);
  expect(session.page("page-1").issues[0]?.rect).toEqual(issue.rect);
  await session.save("page-1");
  expect(pageIsDirty(session.page("page-1"))).toBe(false);
});

test("failed save and failed draft storage prevent leaving", async () => {
  const { session } = await setup("storage-failure");
  edit(session, "不能丢失");
  await expect(session.leave("page-1")).rejects.toThrow("请重试后离开");
  expect(session.page("page-1").issues[0]?.note).toBe("不能丢失");
  await expect(session.leave("page-1")).resolves.toBeUndefined();
});

test("completion flushes all pages, can fail independently, and can be retried", async () => {
  const { session, source } = await setup("complete-failure");
  edit(session, "已保存的问题不阻止完成");
  await expect(session.complete(["page-1", "page-2"])).rejects.toThrow("完成监修失败");
  expect(pageIsDirty(session.page("page-1"))).toBe(false);
  expect(source.completed).toBe(false);
  await session.complete(["page-1", "page-2"]);
  expect(source.completed).toBe(true);
});

test("delete undo restores position and imported metadata after saving", async () => {
  const { session } = await setup();
  session.commit("page-1", []);
  await session.save("page-1");
  session.undo("page-1");
  expect(session.page("page-1").issues).toEqual([issue]);
});

test("a clean review replacement invalidates undo from the old review", async () => {
  const { session } = await setup();
  edit(session, "旧审查修改");
  await session.save("page-1");
  session.receive("page-1", {
    ...session.page("page-1").baseline,
    reviewKey: "review-2",
    issues: [],
  });
  session.undo("page-1");
  expect(session.page("page-1").issues).toEqual([]);
  expect(session.page("page-1").history).toEqual([]);
});

test("a late refresh cannot overwrite an acknowledged save", async () => {
  const { session, source } = await setup();
  const oldDocument = structuredClone(session.page("page-1").baseline);
  const gate = deferred<typeof oldDocument>();
  vi.spyOn(source, "load").mockReturnValueOnce(gate.promise);
  const refresh = session.load("page-1", new AbortController().signal);
  edit(session, "已确认的保存");
  await session.save("page-1");
  gate.resolve(oldDocument);
  await refresh;
  expect(session.page("page-1").baseline.issues[0]?.note).toBe("已确认的保存");
  expect(pageIsDirty(session.page("page-1"))).toBe(false);
});
