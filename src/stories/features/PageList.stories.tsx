import type { Meta, StoryObj } from "@storybook/react-vite";
import PageList from "@/features/PageList/components/business/PageList";
import type { PageInfo } from "@/types/page";

const now = Date.now();

function makePages(count: number): PageInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `page-${i + 1}`,
    chapterId: "ch-1",
    index: i + 1,
    imageUrl: "",
    isUploaded: i < count - 2,
    totalUnitCount: 10 + (i % 5),
    translatedUnitCount: Math.min(
      10 + (i % 5),
      i % 3 === 0 ? 10 + (i % 5) : i * 2,
    ),
    proofreadUnitCount: i % 4 === 0 ? 8 : 0,
    creatorId: "user-0",
    createdAt: now,
    updatedAt: now,
  }));
}

const meta: Meta<typeof PageList> = {
  title: "Features/PageList",
  component: PageList,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PageList>;

export const Default: Story = {
  name: "默认（无操作）",
  args: {
    pages: makePages(12),
    onClickPage: (id) => console.log("clicked page:", id),
  },
};

export const WithDelete: Story = {
  name: "可删除（hover 显示垃圾桶）",
  args: {
    pages: makePages(12),
    onClickPage: (id) => console.log("clicked page:", id),
    enableDelete: true,
    onDeletePage: (id) => console.log("delete page:", id),
  },
};

export const WithUpload: Story = {
  name: "可上传（拖放 Drop Area）",
  args: {
    pages: makePages(8),
    onClickPage: (id) => console.log("clicked page:", id),
    onAddPages: async (files) => {
      console.log(
        "uploaded files:",
        files.map((f) => f.name),
      );
    },
  },
};

export const Empty: Story = {
  name: "空列表（显示上传引导）",
  args: {
    pages: [],
    onClickPage: (id) => console.log("clicked page:", id),
    onAddPages: async (files) => {
      console.log(
        "uploaded files:",
        files.map((f) => f.name),
      );
    },
  },
};

export const WithDeleteAndUpload: Story = {
  name: "全功能（删除 + 上传）",
  args: {
    pages: makePages(10),
    onClickPage: (id) => console.log("clicked page:", id),
    enableDelete: true,
    onDeletePage: (id) => console.log("delete page:", id),
    onAddPages: async (files) => {
      console.log(
        "uploaded files:",
        files.map((f) => f.name),
      );
    },
  },
};
