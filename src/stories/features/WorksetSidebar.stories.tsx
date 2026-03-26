import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import WorksetSidebar from "@/features/ComcList/components/business/WorksetSidebar";
import type { WorksetInfo } from "@/types/workset";

const now = Date.now();

const mockWorksets: WorksetInfo[] = [
  {
    id: "ws-1",
    teamId: "team-1",
    index: 0,
    name: "Personal Collection",
    description: "个人收藏",
    comicCount: 124,
    createdAt: now - 86400000 * 30,
    updatedAt: now - 86400000,
  },
  {
    id: "ws-2",
    teamId: "team-1",
    index: 1,
    name: "Team Shared",
    description: "团队共享",
    comicCount: 45,
    createdAt: now - 86400000 * 20,
    updatedAt: now - 86400000 * 2,
  },
  {
    id: "ws-3",
    teamId: "team-1",
    index: 2,
    name: "Archive 2024",
    description: "2024年归档",
    comicCount: 890,
    createdAt: now - 86400000 * 10,
    updatedAt: now - 86400000 * 3,
  },
  {
    id: "ws-4",
    teamId: "team-1",
    index: 3,
    name: "Public Library",
    description: "公共库",
    comicCount: 12,
    createdAt: now - 86400000 * 5,
    updatedAt: now - 3600000,
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

function InteractiveWorksetSidebar() {
  const [worksets, setWorksets] = useState<WorksetInfo[]>(mockWorksets);
  const [activeId, setActiveId] = useState("ws-1");

  const handleDelete = (worksetId: string) => {
    setWorksets((prev) => prev.filter((ws) => ws.id !== worksetId));
    if (activeId === worksetId && worksets.length > 1) {
      const next = worksets.find((ws) => ws.id !== worksetId);
      if (next) setActiveId(next.id);
    }
    console.log("delete workset:", worksetId);
  };

  const handleCreate = () => {
    const id = `ws-${Date.now()}`;
    const newWs: WorksetInfo = {
      id,
      teamId: "team-1",
      index: worksets.length,
      name: `新工作区 ${worksets.length + 1}`,
      description: "",
      comicCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setWorksets((prev) => [newWs, ...prev]);
    setActiveId(id);
    console.log("create workset");
  };

  return (
    <div className="flex justify-end h-screen bg-slate-50">
      <WorksetSidebar
        activeWorksetId={activeId}
        worksets={worksets}
        onClose={() => console.log("close sidebar")}
        onCreateWorkset={handleCreate}
        onDeleteWorkset={handleDelete}
        onChangeWorkset={(id) => {
          setActiveId(id);
          console.log("change workset:", id);
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
    <div className="flex justify-end h-screen bg-slate-50">
      <WorksetSidebar
        activeWorksetId=""
        worksets={[]}
        onClose={() => console.log("close")}
        onCreateWorkset={() => console.log("create")}
        onDeleteWorkset={() => console.log("delete")}
        onChangeWorkset={() => console.log("change")}
      />
    </div>
  ),
};

export const SingleWorkset: Story = {
  name: "单个工作区",
  render: () => (
    <div className="flex justify-end h-screen bg-slate-50">
      <WorksetSidebar
        activeWorksetId="ws-1"
        worksets={[mockWorksets[0]]}
        onClose={() => console.log("close")}
        onCreateWorkset={() => console.log("create")}
        onDeleteWorkset={() => console.log("delete")}
        onChangeWorkset={() => console.log("change")}
      />
    </div>
  ),
};
