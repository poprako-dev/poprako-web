import { type JSX, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorksetSidebar } from "@/route/_authenticated/_shell/comic-playground/business/comic-list/WorksetSidebar";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";

const now = Date.now();

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("示例数据缺失");
  return value;
}

const mockWorksets: WorksetInfo[] = [
  {
    id: "ws-1",
    teamId: "team-1",
    index: 0,
    name: "Personal Collection",
    description: "个人收藏",
    comicCount: 124,
    createdAt: now - 86_400_000 * 30,
    updatedAt: now - 86_400_000,
  },
  {
    id: "ws-2",
    teamId: "team-1",
    index: 1,
    name: "Team Shared",
    description: "团队共享",
    comicCount: 45,
    createdAt: now - 86_400_000 * 20,
    updatedAt: now - 86_400_000 * 2,
  },
  {
    id: "ws-3",
    teamId: "team-1",
    index: 2,
    name: "Archive 2024",
    description: "2024年归档",
    comicCount: 890,
    createdAt: now - 86_400_000 * 10,
    updatedAt: now - 86_400_000 * 3,
  },
  {
    id: "ws-4",
    teamId: "team-1",
    index: 3,
    name: "Public Library",
    description: "公共库",
    comicCount: 12,
    createdAt: now - 86_400_000 * 5,
    updatedAt: now - 3_600_000,
  },
];

const meta: Meta<typeof WorksetSidebar> = {
  title: "Features/ComcList/WorksetSidebar",
  component: WorksetSidebar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof WorksetSidebar>;

function InteractiveWorksetSidebar(): JSX.Element {
  const [worksets, setWorksets] = useState<WorksetInfo[]>(mockWorksets);
  const [activeId, setActiveId] = useState("ws-1");

  const handleCreate = (): void => {
    const id = `ws-${String(Date.now())}`;
    const newWs: WorksetInfo = {
      id,
      teamId: "team-1",
      index: worksets.length,
      name: `新工作区 ${String(worksets.length + 1)}`,
      description: "",
      comicCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setWorksets((prev) => [newWs, ...prev]);
    setActiveId(id);
  };

  return (
    <div className="flex justify-end h-screen bg-muted">
      <WorksetSidebar
        activeWorksetId={activeId}
        worksets={worksets}
        onClose={() => {
          return;
        }}
        onCreateWorkset={handleCreate}
        onChangeWorkset={(id) => {
          setActiveId(id);
        }}
      />
    </div>
  );
}

export const Interactive: Story = {
  name: "交互式 (完整功能)",
  render: () => <InteractiveWorksetSidebar />,
};

export const Empty: Story = {
  name: "空列表",
  render: () => (
    <div className="flex justify-end h-screen bg-muted">
      <WorksetSidebar
        activeWorksetId=""
        worksets={[]}
        onClose={() => {
          return;
        }}
        onCreateWorkset={() => {
          return;
        }}
        onChangeWorkset={() => {
          return;
        }}
      />
    </div>
  ),
};

export const SingleWorkset: Story = {
  name: "单个工作区",
  render: () => (
    <div className="flex justify-end h-screen bg-muted">
      <WorksetSidebar
        activeWorksetId="ws-1"
        worksets={[required(mockWorksets[0])]}
        onClose={() => {
          return;
        }}
        onCreateWorkset={() => {
          return;
        }}
        onChangeWorkset={() => {
          return;
        }}
      />
    </div>
  ),
};
