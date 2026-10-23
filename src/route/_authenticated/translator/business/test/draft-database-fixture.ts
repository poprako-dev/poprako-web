import type { DraftDatabase, DraftRow } from "../persistence/draft-database";
export function createDraftDatabaseFixture(): DraftDatabase {
  let rows: DraftRow[] = [];
  let chain: Promise<unknown> = Promise.resolve();
  function transact<T>(
    change: (rows: DraftRow[]) => { rows: DraftRow[]; result: T },
    key?: string,
  ): Promise<T> {
    const next = chain.then(() => {
      const selected = key === undefined ? rows : rows.filter((row) => row.key === key);
      const changed = change(structuredClone(selected));
      rows = structuredClone(
        key === undefined
          ? changed.rows
          : [...rows.filter((row) => row.key !== key), ...changed.rows],
      );
      return structuredClone(changed.result);
    });
    chain = next.catch(() => {
      /* A failed transaction does not block the next one. */
    });
    return next;
  }
  return { transact };
}
