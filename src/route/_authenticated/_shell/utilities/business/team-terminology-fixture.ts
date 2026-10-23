import type { TermbaseInfo } from "@/route/_authenticated/business/terminology/termbase";
import type { TermInfo } from "@/route/_authenticated/business/terminology/term";
import type { Result } from "@/shared/utility/result";
import type { TeamTerminologyDataSource } from "./team-terminology";

export const fixtureBase: TermbaseInfo = {
  id: "team-base",
  teamId: "team-1",
  name: "奇幻世界共用词",
  description: "种族、职业和魔法术语",
  termCount: 2,
  creatorId: "user-1",
  createdAt: 1,
  updatedAt: 2,
};
export const fixtureTerms: TermInfo[] = [
  {
    id: "term-1",
    termbaseId: fixtureBase.id,
    source: "団長",
    targets: ["团长", "队长"],
    comment: "骑士团的首领",
    creatorId: "user-1",
    createdAt: 1,
    updatedAt: 2,
  },
  {
    id: "term-2",
    termbaseId: fixtureBase.id,
    source: "エルフ",
    targets: ["精灵"],
    creatorId: "user-1",
    createdAt: 1,
    updatedAt: 2,
  },
];

type Store = { bases: TermbaseInfo[]; terms: TermInfo[] };
function success<T>(data: T): Promise<Result<T>> {
  return Promise.resolve({ success: true, data });
}
function readers(
  store: Store,
): Pick<
  TeamTerminologyDataSource,
  "listTermbases" | "getTermbase" | "listTerms" | "exportTermbase"
> {
  return {
    listTermbases: ({ fuzzyName, offset, limit }) =>
      success(
        store.bases
          .filter((base) => base.name.includes(fuzzyName ?? ""))
          .slice(offset, offset + limit),
      ),
    getTermbase: (id) => {
      const base = store.bases.find((item) => item.id === id);
      return base
        ? success({ ...base })
        : Promise.resolve({ success: false, error: "术语库不存在" });
    },
    listTerms: ({ termbaseId, fuzzySource, offset, limit }) =>
      success(
        store.terms
          .filter(
            (term) => term.termbaseId === termbaseId && term.source.includes(fuzzySource ?? ""),
          )
          .slice(offset, offset + limit),
      ),
    exportTermbase: (id) =>
      success(
        JSON.stringify({
          name: store.bases.find((base) => base.id === id)?.name,
          terms: store.terms
            .filter((term) => term.termbaseId === id)
            .map(({ source, targets, comment }) => ({ source, targets, comment })),
        }),
      ),
  };
}
function baseWriters(
  store: Store,
): Pick<TeamTerminologyDataSource, "createTermbase" | "updateTermbase" | "deleteTermbase"> {
  return {
    createTermbase: (args) => {
      const id = crypto.randomUUID();
      store.bases.unshift({ ...fixtureBase, ...args, id, termCount: 0 });
      return success(id);
    },
    updateTermbase: (id, args) => {
      store.bases = store.bases.map((base) => (base.id === id ? { ...base, ...args } : base));
      return success(undefined);
    },
    deleteTermbase: (id) => {
      store.bases = store.bases.filter((base) => base.id !== id);
      store.terms = store.terms.filter((term) => term.termbaseId !== id);
      return success(undefined);
    },
  };
}
function updateCount(store: Store, id: string): void {
  const base = store.bases.find((item) => item.id === id);
  if (base) base.termCount = store.terms.filter((term) => term.termbaseId === id).length;
}
function termWriters(
  store: Store,
): Pick<TeamTerminologyDataSource, "createTerm" | "updateTerm" | "deleteTerm"> {
  return {
    createTerm: (args) => {
      const id = crypto.randomUUID();
      store.terms.unshift({ ...args, id, creatorId: "user-1", createdAt: 1, updatedAt: 2 });
      updateCount(store, args.termbaseId);
      return success(id);
    },
    updateTerm: (id, args) => {
      store.terms = store.terms.map((term) => (term.id === id ? { ...term, ...args } : term));
      return success(undefined);
    },
    deleteTerm: (id) => {
      const term = store.terms.find((item) => item.id === id);
      store.terms = store.terms.filter((item) => item.id !== id);
      if (term) updateCount(store, term.termbaseId);
      return success(undefined);
    },
  };
}
function importer(store: Store): TeamTerminologyDataSource["importTermbase"] {
  return async (content) => {
    const data = JSON.parse(content) as {
      name: string;
      description?: string;
      terms: Pick<TermInfo, "source" | "targets" | "comment">[];
    };
    if (store.bases.some((base) => base.name === data.name))
      return { success: false, error: "术语库名称已存在" };
    const created = await baseWriters(store).createTermbase(data);
    if (!created.success) return created;
    for (const term of data.terms)
      await termWriters(store).createTerm({ ...term, termbaseId: created.data });
    return {
      success: true,
      data: {
        id: created.data,
        created: true,
        createdTermCount: data.terms.length,
        mergedTermCount: 0,
      },
    };
  };
}
export function createTeamTerminologyFixture(): TeamTerminologyDataSource {
  const store: Store = {
    bases: [{ ...fixtureBase }],
    terms: fixtureTerms.map((term) => ({ ...term })),
  };
  return {
    ...readers(store),
    ...baseWriters(store),
    ...termWriters(store),
    appendTermbase: () =>
      Promise.resolve({ success: true, data: { added: 0, updated: 0, unchanged: 0 } }),
    importTermbase: importer(store),
  };
}
