import type { ReviewDraft, ReviewerEditing } from "./review-editing";

export function createReviewDraftStore(
  accountId: string,
  chapterId: string,
): Pick<ReviewerEditing, "readDraft" | "writeDraft"> {
  const scope = JSON.stringify([accountId, chapterId]);
  const open = createConnection();
  async function readDraft(pageId: string): Promise<ReviewDraft | null> {
    const db = await open();
    return new Promise((resolve, reject) => {
      const request = db.transaction("pages").objectStore("pages").get([scope, pageId]);
      request.onsuccess = () => {
        resolve((request.result as ReviewDraft | undefined) ?? null);
      };
      request.onerror = () => {
        reject(request.error ?? new Error("无法读取标注草稿"));
      };
    });
  }
  async function writeDraft(pageId: string, draft: ReviewDraft | null): Promise<void> {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("pages", "readwrite");
      const store = tx.objectStore("pages");
      if (draft) store.put(draft, [scope, pageId]);
      else store.delete([scope, pageId]);
      tx.oncomplete = () => {
        resolve();
      };
      tx.onabort = () => {
        reject(tx.error ?? new Error("标注草稿存储失败"));
      };
    });
  }
  return { readDraft, writeDraft };
}

function createConnection(): () => Promise<IDBDatabase> {
  let connection: Promise<IDBDatabase> | undefined;
  function open(): Promise<IDBDatabase> {
    connection ??= new Promise((resolve, reject) => {
      const request = indexedDB.open("poprako-review-drafts", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("pages");
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          connection = undefined;
        };
        resolve(request.result);
      };
      request.onerror = () => {
        connection = undefined;
        reject(request.error ?? new Error("无法打开标注草稿存储"));
      };
    });
    return connection;
  }
  return open;
}
