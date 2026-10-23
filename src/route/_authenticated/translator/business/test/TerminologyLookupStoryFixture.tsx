import type { ReactElement } from "react";
import { userEvent, within } from "storybook/test";
import { TerminologyLookupPreview } from "./TerminologyLookupPreview";
import type { TerminologyDataSource } from "@/route/_authenticated/business/terminology/terminology-contract";
import type { TermInfo } from "@/route/_authenticated/business/terminology/term";
import type { TermbaseInfo } from "@/route/_authenticated/business/terminology/termbase";

const termbases: TermbaseInfo[] = [
  {
    id: "termbase-comic",
    comicId: "comic-1",
    name: "角色称谓",
    description: "本作角色姓名、敬称与身份",
    termCount: 34,
    creatorId: "user-1",
    createdAt: 10,
    updatedAt: 20,
  },
  {
    id: "termbase-team",
    teamId: "team-1",
    name: "奇幻世界共用词",
    description: "团队共享的种族、职业和魔法术语",
    termCount: 126,
    creatorId: "user-2",
    createdAt: 11,
    updatedAt: 21,
  },
  {
    id: "termbase-places",
    comicId: "comic-1",
    name: "地名",
    description: "城镇、街道与建筑名称",
    termCount: 18,
    creatorId: "user-1",
    createdAt: 12,
    updatedAt: 22,
  },
];

const terms: TermInfo[] = [
  {
    id: "term-1",
    termbaseId: "termbase-comic",
    source: "アリシア",
    targets: ["艾莉西亚", "阿莉西亚"],
    comment: "正式场合使用全名，不缩写。",
    creatorId: "user-1",
    createdAt: 10,
    updatedAt: 20,
  },
  {
    id: "term-2",
    termbaseId: "termbase-comic",
    source: "団長",
    targets: ["团长"],
    creatorId: "user-1",
    createdAt: 11,
    updatedAt: 21,
  },
  {
    id: "term-3",
    termbaseId: "termbase-comic",
    source: "先生",
    targets: ["老师", "先生"],
    comment: "根据说话人与场景选择。",
    creatorId: "user-2",
    createdAt: 12,
    updatedAt: 22,
  },
];

function filterPage<T>(items: T[], offset: number, limit: number): T[] {
  return items.slice(offset, offset + limit);
}

function createTermbaseReaders(
  currentTermbases: TermbaseInfo[],
): Pick<TerminologyDataSource, "listTermbases"> {
  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    listTermbases: async ({ fuzzyName, offset, limit }) => {
      const query = fuzzyName?.toLocaleLowerCase();
      const filtered = query
        ? currentTermbases.filter((item) => item.name.toLocaleLowerCase().includes(query))
        : currentTermbases;
      return { success: true, data: filterPage(filtered, offset, limit) };
    },
  };
}

function createTermReaders(currentTerms: TermInfo[]): Pick<TerminologyDataSource, "listTerms"> {
  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    listTerms: async ({ termbaseId, fuzzySource, offset, limit }) => {
      const query = fuzzySource?.toLocaleLowerCase();
      const matching = currentTerms.filter((item) => item.termbaseId === termbaseId);
      const filtered = query
        ? matching.filter((item) => item.source.toLocaleLowerCase().includes(query))
        : matching;
      return { success: true, data: filterPage(filtered, offset, limit) };
    },
  };
}

function createTermbaseWriters(
  currentTermbases: TermbaseInfo[],
): Pick<TerminologyDataSource, "createTermbase" | "updateTermbase" | "deleteTermbase"> {
  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    createTermbase: async (args) => {
      const id = `termbase-created-${String(currentTermbases.length + 1)}`;
      currentTermbases.unshift({
        id,
        comicId: "comic-1",
        name: args.name,
        description: args.description ?? "",
        termCount: 0,
        creatorId: "user-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { success: true, data: id };
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    updateTermbase: async (id, args) => {
      const item = currentTermbases.find((termbase) => termbase.id === id);
      if (item) Object.assign(item, args, { description: args.description ?? "" });
      return { success: true, data: undefined };
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    deleteTermbase: async (id) => {
      const index = currentTermbases.findIndex((termbase) => termbase.id === id);
      if (index !== -1) currentTermbases.splice(index, 1);
      return { success: true, data: undefined };
    },
  };
}

function createTermWriters(
  currentTerms: TermInfo[],
): Pick<TerminologyDataSource, "createTerm" | "updateTerm" | "deleteTerm"> {
  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    createTerm: async (args) => {
      const id = `term-created-${String(currentTerms.length + 1)}`;
      currentTerms.unshift({
        id,
        termbaseId: args.termbaseId,
        source: args.source,
        targets: args.targets,
        comment: args.comment,
        creatorId: "user-1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { success: true, data: id };
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    updateTerm: async (id, args) => {
      const item = currentTerms.find((term) => term.id === id);
      if (item) Object.assign(item, args);
      return { success: true, data: undefined };
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    deleteTerm: async (id) => {
      const index = currentTerms.findIndex((term) => term.id === id);
      if (index !== -1) currentTerms.splice(index, 1);
      return { success: true, data: undefined };
    },
  };
}

type ImportDocument = {
  name: string;
  description?: string | null;
  terms: { source: string; targets: string[]; comment?: string | null }[];
};

function createTermbaseImporter(
  currentTermbases: TermbaseInfo[],
  currentTerms: TermInfo[],
): TerminologyDataSource["importTermbase"] {
  return async (content) => {
    const document = JSON.parse(content) as ImportDocument;
    const writers = createTermbaseWriters(currentTermbases);
    const result = await writers.createTermbase({
      name: document.name,
      description: document.description ?? undefined,
    });
    if (!result.success) return result;
    const termWriter = createTermWriters(currentTerms);
    for (const term of document.terms) {
      await termWriter.createTerm({
        ...term,
        termbaseId: result.data,
        comment: term.comment ?? undefined,
      });
    }
    const termbase = currentTermbases.find((item) => item.id === result.data);
    if (termbase) termbase.termCount = document.terms.length;
    return {
      success: true,
      data: {
        id: result.data,
        created: true,
        createdTermCount: document.terms.length,
        mergedTermCount: 0,
      },
    };
  };
}

export function createDataSource({
  termbaseItems = termbases,
  termItems = terms,
}: {
  termbaseItems?: TermbaseInfo[] | undefined;
  termItems?: TermInfo[] | undefined;
} = {}): TerminologyDataSource {
  const currentTermbases = [...termbaseItems];
  const currentTerms = [...termItems];

  return {
    appendTermbase: () =>
      Promise.resolve({ success: true, data: { added: 0, updated: 0, unchanged: 0 } }),
    importTermbase: createTermbaseImporter(currentTermbases, currentTerms),
    exportTermbase: (id) => {
      const termbase = currentTermbases.find((item) => item.id === id);
      return Promise.resolve({
        success: true,
        data: JSON.stringify({
          name: termbase?.name ?? "术语库",
          description: termbase?.description ?? null,
          terms: currentTerms
            .filter((term) => term.termbaseId === id)
            .map(({ source, targets, comment }) => ({ source, targets, comment: comment ?? null })),
        }),
      });
    },
    ...createTermbaseReaders(currentTermbases),
    ...createTermReaders(currentTerms),
    ...createTermbaseWriters(currentTermbases),
    ...createTermWriters(currentTerms),
  };
}

export function renderAtWidth(
  width: number,
): (args: { dataSource: TerminologyDataSource }) => ReactElement {
  return (args: { dataSource: TerminologyDataSource }): ReactElement => (
    <div
      data-testid="terminology-canvas"
      className="@container relative h-112 overflow-hidden bg-surface-stone-600"
      style={{ width }}
    >
      <TerminologyLookupPreview {...args} />
    </div>
  );
}

export function lookupWidth(canvasElement: HTMLElement): number {
  return within(canvasElement).getByTestId("terminology-lookup").getBoundingClientRect().width;
}

export async function longPress(element: HTMLElement): Promise<void> {
  await userEvent.pointer([{ target: element, keys: "[MouseLeft>]" }]);
  await new Promise((resolve) => setTimeout(resolve, 550));
  await userEvent.pointer([{ target: element, keys: "[/MouseLeft]" }]);
}
