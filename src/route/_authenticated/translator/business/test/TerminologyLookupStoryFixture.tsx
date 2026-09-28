import type { ReactElement } from "react";
import { userEvent, within } from "storybook/test";
import { TerminologyLookupBar } from "@/route/_authenticated/translator/business/terminology/TerminologyLookupBar";
import type { TerminologyDataSource } from "@/route/_authenticated/translator/business/contract/terminology";
import type { TermInfo } from "@/route/_authenticated/translator/business/terminology/term";
import type { TermbaseInfo } from "@/route/_authenticated/translator/business/terminology/termbase";

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
    // eslint-disable-next-line @typescript-eslint/require-await
    listTermbases: async ({ fuzzyName, offset, limit }) => {
      const query = fuzzyName?.toLocaleLowerCase();
      const filtered = query
        ? currentTermbases.filter((item) => item.name.toLocaleLowerCase().includes(query))
        : currentTermbases;
      return { success: true, data: filterPage(filtered, offset, limit) };
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    listTerms: async ({ fuzzySource, offset, limit }) => {
      const query = fuzzySource?.toLocaleLowerCase();
      const filtered = query
        ? currentTerms.filter((item) => item.source.toLocaleLowerCase().includes(query))
        : currentTerms;
      return { success: true, data: filterPage(filtered, offset, limit) };
    },
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
      if (item) {
        Object.assign(item, args, { description: args.description ?? "" });
      }
      return { success: true, data: undefined };
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    deleteTermbase: async (id) => {
      const index = currentTermbases.findIndex((termbase) => termbase.id === id);
      if (index !== -1) currentTermbases.splice(index, 1);
      return { success: true, data: undefined };
    },
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

export function renderAtWidth(
  width: number,
): (args: { dataSource: TerminologyDataSource }) => ReactElement {
  return (args: { dataSource: TerminologyDataSource }): ReactElement => (
    <div
      data-testid="terminology-canvas"
      className="@container relative h-112 overflow-hidden bg-foreground"
      style={{ width }}
    >
      <TerminologyLookupBar {...args} />
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
