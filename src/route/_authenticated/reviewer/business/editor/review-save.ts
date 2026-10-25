import { mergeIssues } from "./merge-issues";
import { pageIsDirty, ReviewChangedError, message } from "./review-editing";
import type { ReviewSession } from "./review-session";
import { remapIssueIds } from "./review-save-receipt";
import type { ReviewEditPage, ReviewSubmission, ReviewSaveResult } from "./review-editing";

export async function saveReviewPage(session: ReviewSession, pageId: string): Promise<void> {
  session.publish(pageId, { ...session.page(pageId), saving: true, error: null });
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (await saveAttempt(session, pageId)) return;
    }
    throw new Error("本页仍在更新，修改已保留，请重试");
  } catch (error) {
    session.publish(pageId, { ...session.page(pageId), error: message(error) });
    await session.retain(pageId);
    throw error;
  } finally {
    session.publish(pageId, { ...session.page(pageId), saving: false });
  }
}

async function saveAttempt(session: ReviewSession, pageId: string): Promise<boolean> {
  const page = session.page(pageId);
  if (page.blocked) throw new Error("成稿或审查已更新，请先核对");
  if (!pageIsDirty(page) && !session.batches.has(pageId)) return true;
  if (page.issues.some((issue) => !issue.variant.trim())) throw new Error("请填写问题类型");
  const batch = session.batches.get(pageId) ?? {
    draft: { baseline: page.baseline, issues: page.issues },
    saveId: crypto.randomUUID(),
  };
  session.batches.set(pageId, batch);
  await session.retain(pageId);
  try {
    const remote = await session.source.save(pageId, batch.draft, batch.saveId);
    const current = session.page(pageId);
    if (
      remote.reviewKey !== batch.draft.baseline.reviewKey ||
      remote.imageKey !== batch.draft.baseline.imageKey
    ) {
      session.receive(pageId, remote);
      session.batches.delete(pageId);
      return false;
    }
    session.publish(pageId, reconcileSave(batch.draft, current, remote));
    session.batches.delete(pageId);
    await session.retain(pageId);
    return !pageIsDirty(session.page(pageId));
  } catch (error) {
    if (!(error instanceof ReviewChangedError)) throw error;
    session.batches.delete(pageId);
    session.receive(pageId, error.document);
    return false;
  }
}

function reconcileSave(
  draft: ReviewSubmission,
  current: ReviewEditPage,
  remote: ReviewSaveResult,
): ReviewEditPage {
  const receipts = remote.createdIssueIds ?? [];
  const submitted = remapIssueIds(draft.issues, receipts);
  const local = remapIssueIds(current.issues, receipts);
  const history = current.history.map((entry) => ({
    before: remapIssueIds(entry.before, receipts),
    after: remapIssueIds(entry.after, receipts),
  }));
  return {
    ...current,
    baseline: remote,
    issues: mergeIssues(submitted, local, remote.issues),
    history,
    error: null,
  };
}
