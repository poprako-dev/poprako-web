export type DraftRow = { key: string; scope: string; pageId: string; raw: string; touched: number };
export interface DraftDatabase {
  transact: <T>(
    change: (rows: DraftRow[]) => { rows: DraftRow[]; result: T },
    key?: string,
  ) => Promise<T>;
}
const budget = 4 * 1024 * 1024;

export function limitDraftRows(rows: DraftRow[], current: string): DraftRow[] {
  const encoder = new TextEncoder();
  const sized = rows.map((row) => ({ row, bytes: encoder.encode(row.raw).length }));
  let bytes = sized.reduce((total, entry) => total + entry.bytes, 0);
  if (bytes <= budget) return [...rows];
  const candidates = sized
    .filter((entry) => entry.row.key !== current)
    .sort((a, b) => a.row.touched - b.row.touched);
  const evicted = new Set<string>();
  for (const entry of candidates) {
    evicted.add(entry.row.key);
    bytes -= entry.bytes;
    if (bytes <= budget) break;
  }
  if (bytes > budget) throw new Error("本页草稿超过本地容量限制");
  return rows.filter((row) => !evicted.has(row.key));
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
    key?: string,
  ): Promise<T> {
    const db = await open();
    return transactDraftRows(db, change, key);
  }
  return { transact };
}

function transactDraftRows<T>(
  db: IDBDatabase,
  change: (rows: DraftRow[]) => { rows: DraftRow[]; result: T },
  key?: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction("pages", "readwrite");
    const store = tx.objectStore("pages");
    let result: T;
    let failure: unknown;
    const request = key === undefined ? store.getAll() : store.getAll(key);
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
  const previousByKey = new Map(before.map((row) => [row.key, row]));
  const keys = new Set(next.map((row) => row.key));
  for (const row of before) {
    if (!keys.has(row.key)) store.delete(row.key);
  }
  for (const row of next) {
    if (previousByKey.get(row.key)?.raw !== row.raw) store.put(row);
  }
}
