export type DraftRow = { key: string; scope: string; pageId: string; raw: string; touched: number };
export interface DraftDatabase {
  transact: <T>(change: (rows: DraftRow[]) => { rows: DraftRow[]; result: T }) => Promise<T>;
}
const budget = 4 * 1024 * 1024;

export function limitDraftRows(rows: DraftRow[], current: string): DraftRow[] {
  let result = [...rows];
  const size = (): number =>
    result.reduce((n, row) => n + new TextEncoder().encode(row.raw).length, 0);
  while (size() > budget) {
    const oldest = result.filter((r) => r.key !== current).sort((a, b) => a.touched - b.touched)[0];
    if (!oldest) throw new Error("本页草稿超过本地容量限制");
    result = result.filter((r) => r.key !== oldest.key);
  }
  return result;
}

export function createDraftDatabase(): DraftDatabase {
  let connection: Promise<IDBDatabase> | undefined;
  function open(): Promise<IDBDatabase> {
    connection ??= new Promise((resolve, reject) => {
      const request = indexedDB.open("poprako-edit-sequences", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("pages", { keyPath: "key" });
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        connection = undefined;
        reject(request.error ?? new Error("无法打开草稿存储"));
      };
      request.onblocked = () => {
        reject(new Error("草稿存储升级被其他标签阻塞"));
      };
    });
    return connection;
  }
  async function transact<T>(
    change: (rows: DraftRow[]) => { rows: DraftRow[]; result: T },
  ): Promise<T> {
    const db = await open();
    return transactDraftRows(db, change);
  }
  return { transact };
}

function transactDraftRows<T>(
  db: IDBDatabase,
  change: (rows: DraftRow[]) => { rows: DraftRow[]; result: T },
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction("pages", "readwrite");
    const store = tx.objectStore("pages");
    let result: T;
    let failure: unknown;
    const request = store.getAll();
    request.onsuccess = () => {
      try {
        const before = request.result as DraftRow[];
        const next = change(before);
        result = next.result;
        applyDraftRowChanges(store, before, next.rows);
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => {
      resolve(result);
    };
    tx.onabort = () => {
      reject(failure instanceof Error ? failure : (tx.error ?? new Error("草稿存储写入失败")));
    };
    tx.onerror = () => {
      /* onabort reports the transaction failure. */
    };
  });
}

function applyDraftRowChanges(store: IDBObjectStore, before: DraftRow[], next: DraftRow[]): void {
  const keys = new Set(next.map((row) => row.key));
  for (const row of before) {
    if (!keys.has(row.key)) store.delete(row.key);
  }
  for (const row of next) {
    if (before.find((previous) => previous.key === row.key)?.raw !== row.raw) store.put(row);
  }
}
