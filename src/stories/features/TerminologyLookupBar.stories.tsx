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
  return {
    listTermbases: async ({ fuzzyName, offset, limit }) => {
      const query = fuzzyName?.toLocaleLowerCase();
      const filtered = query
        ? termbaseItems.filter((item) => item.name.toLocaleLowerCase().includes(query))
        : termbaseItems;
      return { success: true, data: filterPage(filtered, offset, limit) };
    },
    listTerms: async ({ fuzzySource, offset, limit }) => {
      const query = fuzzySource?.toLocaleLowerCase();
      const filtered = query
        ? termItems.filter((item) => item.source.toLocaleLowerCase().includes(query))
        : termItems;
      return { success: true, data: filterPage(filtered, offset, limit) };
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
