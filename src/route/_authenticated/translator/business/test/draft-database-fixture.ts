import type { DraftDatabase, DraftRow } from "../persistence/draft-database";
export function createDraftDatabaseFixture(): DraftDatabase {
  let rows: DraftRow[] = [];
  let chain: Promise<unknown> = Promise.resolve();
  function transact<T>(change: (rows: DraftRow[]) => { rows: DraftRow[]; result: T }): Promise<T> {
    const next = chain.then(() => {
      const changed = change(structuredClone(rows));
      rows = structuredClone(changed.rows);
      return structuredClone(changed.result);
    });
    chain = next.catch(() => {
      /* A failed transaction does not block the next one. */
    });
    return next;
  }
  return { transact };
}
