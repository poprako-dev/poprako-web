import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import TerminologyLookupBar from "@/features/BaseTranslator/features/TerminologyLookup";
import type { TerminologyDataSource } from "@/features/BaseTranslator/types/terminology";
import type { TermInfo } from "@/types/term";
import type { TermbaseInfo } from "@/types/termbase";

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

function filterPage<T>(items: T[], offset: number, limit: number) {
  return items.slice(offset, offset + limit);
}

function createDataSource({
  termbaseItems = termbases,
  termItems = terms,
}: {
  termbaseItems?: TermbaseInfo[];
  termItems?: TermInfo[];
} = {}): TerminologyDataSource {
  const currentTermbases = [...termbaseItems];
  const currentTerms = [...termItems];

  return {
    listTermbases: async ({ fuzzyName, offset, limit }) => {
      const query = fuzzyName?.toLocaleLowerCase();
      const filtered = query
        ? currentTermbases.filter((item) => item.name.toLocaleLowerCase().includes(query))
        : currentTermbases;
      return { success: true, data: filterPage(filtered, offset, limit) };
    },
    listTerms: async ({ fuzzySource, offset, limit }) => {
      const query = fuzzySource?.toLocaleLowerCase();
      const filtered = query
        ? currentTerms.filter((item) => item.source.toLocaleLowerCase().includes(query))
        : currentTerms;
      return { success: true, data: filterPage(filtered, offset, limit) };
    },
    createTermbase: async (args) => {
      const id = `termbase-created-${currentTermbases.length + 1}`;
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
    updateTermbase: async (id, args) => {
      const item = currentTermbases.find((termbase) => termbase.id === id);
      if (item) Object.assign(item, args, { description: args.description ?? "" });
      return { success: true, data: undefined };
    },
    deleteTermbase: async (id) => {
      const index = currentTermbases.findIndex((termbase) => termbase.id === id);
      if (index >= 0) currentTermbases.splice(index, 1);
      return { success: true, data: undefined };
    },
    createTerm: async (args) => {
      const id = `term-created-${currentTerms.length + 1}`;
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
    updateTerm: async (id, args) => {
      const item = currentTerms.find((term) => term.id === id);
      if (item) Object.assign(item, args);
      return { success: true, data: undefined };
    },
    deleteTerm: async (id) => {
      const index = currentTerms.findIndex((term) => term.id === id);
      if (index >= 0) currentTerms.splice(index, 1);
      return { success: true, data: undefined };
    },
  };
}

type CanvasFrameProps = {
  children: ReactNode;
  width: number;
};

function CanvasFrame({ children, width }: CanvasFrameProps) {
  return (
    <div
      data-testid="terminology-canvas"
      className="@container relative h-112 overflow-hidden bg-stone-600"
      style={{ width }}
    >
      {children}
    </div>
  );
}

function renderAtWidth(width: number) {
  return (args: { dataSource: TerminologyDataSource }) => (
    <CanvasFrame width={width}>
      <TerminologyLookupBar {...args} />
    </CanvasFrame>
  );
}

function lookupWidth(canvasElement: HTMLElement) {
  return within(canvasElement)
    .getByTestId("terminology-lookup")
    .getBoundingClientRect()
    .width;
}

async function longPress(element: HTMLElement) {
  await userEvent.pointer([{ target: element, keys: "[MouseLeft>]" }]);
  await new Promise((resolve) => setTimeout(resolve, 550));
  await userEvent.pointer([{ target: element, keys: "[/MouseLeft]" }]);
}

const meta: Meta<typeof TerminologyLookupBar> = {
  title: "Features/BaseTranslator/TerminologyLookupBar",
  component: TerminologyLookupBar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  render: renderAtWidth(900),
};

export default meta;
type Story = StoryObj<typeof TerminologyLookupBar>;

export const Unselected: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(Math.round(lookupWidth(canvasElement))).toBe(180);
    }, { timeout: 1000 });
  },
};

export const MixedTermbases: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    await waitFor(() => {
      expect(canvas.getByText("角色称谓")).toBeVisible();
      expect(canvas.getByText("团队")).toBeVisible();
      expect(canvas.getAllByText("本作")).toHaveLength(2);
      expect(Math.round(lookupWidth(canvasElement))).toBe(360);
    }, { timeout: 3000 });
  },
};

export const TermList: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    const option = await canvas.findByRole("option", { name: /角色称谓/ });
    await waitFor(() => expect(option).toBeVisible(), { timeout: 3000 });
    await userEvent.click(option);
    await userEvent.click(canvas.getByRole("textbox", { name: "搜索术语原文" }));
    await waitFor(() => {
      expect(canvas.getByText("アリシア")).toBeVisible();
    }, { timeout: 3000 });
  },
};

export const DebouncedSearch: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    const search = canvas.getByRole("textbox", { name: "搜索术语库名称" });
    await userEvent.type(search, "地名");
    await waitFor(() => {
      expect(canvas.getByRole("option", { name: /地名/ })).toBeVisible();
      expect(canvas.queryByRole("option", { name: /角色称谓/ })).toBeNull();
    }, { timeout: 3000 });
  },
};

export const CreateTermbase: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    await userEvent.click(await canvas.findByRole("button", { name: "新建术语库" }));
    await userEvent.type(page.getByRole("textbox", { name: "名称" }), "战斗用语");
    await userEvent.click(page.getByRole("button", { name: "保存" }));
    await waitFor(() => {
      expect(canvas.getByRole("option", { name: /战斗用语/ })).toBeVisible();
    }, { timeout: 3000 });
  },
};

export const EditTermbaseByLongPress: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    const option = await canvas.findByRole("option", { name: /角色称谓/ });
    await longPress(option);
    await waitFor(() => {
      expect(page.getByRole("dialog", { name: "编辑术语库" })).toBeVisible();
    });
    await userEvent.click(page.getByRole("button", { name: "删除术语库" }));
    expect(page.getByRole("dialog", { name: "删除术语库" })).toBeVisible();
    expect(page.getByText("删除后，其中全部术语也会一并删除。")).toBeVisible();
  },
};

export const CreateTerm: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    await userEvent.click(await canvas.findByRole("option", { name: /角色称谓/ }));
    await userEvent.click(canvas.getByRole("textbox", { name: "搜索术语原文" }));
    await userEvent.click(await canvas.findByRole("button", { name: "新建术语" }));
    await userEvent.type(page.getByRole("textbox", { name: "原文" }), "副団長");
    await userEvent.type(page.getByRole("textbox", { name: "译名 1" }), "副团长");
    await userEvent.click(page.getByRole("button", { name: "保存" }));
    await waitFor(() => {
      expect(canvas.getByText("副団長")).toBeVisible();
    }, { timeout: 3000 });
  },
};

export const TeamTermbaseReadOnly: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    await userEvent.click(await canvas.findByRole("option", { name: /奇幻世界共用词/ }));
    await userEvent.click(canvas.getByRole("textbox", { name: "搜索术语原文" }));
    await waitFor(() => {
      expect(canvas.getByText("奇幻世界共用词")).toBeVisible();
      expect(canvas.queryByRole("button", { name: "新建术语" })).toBeNull();
    }, { timeout: 3000 });
  },
};

export const Loading: Story = {
  args: {
    dataSource: {
      ...createDataSource(),
      listTermbases: () => new Promise(() => undefined),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
  },
};

export const Empty: Story = {
  args: { dataSource: createDataSource({ termbaseItems: [] }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    await waitFor(() => {
      expect(canvas.getByText("没有找到术语库")).toBeVisible();
    }, { timeout: 3000 });
  },
};

export const ErrorWithRetry: Story = {
  args: {
    dataSource: {
      ...createDataSource(),
      listTermbases: async () => ({ success: false, error: "术语库暂时不可用" }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    await waitFor(() => {
      expect(canvas.getByText("术语库暂时不可用")).toBeVisible();
    }, { timeout: 3000 });
  },
};

export const Mobile390: Story = {
  args: { dataSource: createDataSource() },
  render: renderAtWidth(390),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    await waitFor(() => {
      expect(canvas.getByText("角色称谓")).toBeVisible();
      expect(Math.round(lookupWidth(canvasElement))).toBe(374);
    }, { timeout: 3000 });
  },
};

export const Tablet768: Story = {
  args: { dataSource: createDataSource() },
  render: renderAtWidth(768),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    await waitFor(() => {
      expect(canvas.getByText("角色称谓")).toBeVisible();
      expect(Math.round(lookupWidth(canvasElement))).toBe(307);
    }, { timeout: 3000 });
  },
};
