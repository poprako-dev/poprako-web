import type { Meta, StoryObj } from "@storybook/react-vite";
import BaseTranslator from "@/features/BaseTranslator/components/business/BaseTranslator";
import type { Unit } from "@/types/unit";
import type { Project } from "@/types/project";

const DEMO_IMAGE =
  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1200&q=80";

const mockUnits: Unit[] = [
  {
    id: "1",
    index: 0,
    isBubble: true,
    xCoord: 0.22,
    yCoord: 0.18,
    proved: false,
    translatedText: "——你在这里啊，终于找到你了。",
  },
  {
    id: "2",
    index: 1,
    isBubble: false,
    xCoord: 0.65,
    yCoord: 0.28,
    proved: false,
  },
  {
    id: "3",
    index: 2,
    isBubble: true,
    xCoord: 0.38,
    yCoord: 0.52,
    proved: true,
    translatedText: "不……这不可能。",
    provedText: "不……这怎么可能。",
  },
  {
    id: "4",
    index: 3,
    isBubble: true,
    xCoord: 0.72,
    yCoord: 0.62,
    proved: false,
    translatedText: "冷静下来，听我说。",
  },
  {
    id: "5",
    index: 4,
    isBubble: false,
    xCoord: 0.48,
    yCoord: 0.8,
    proved: false,
  },
];

const mockProject: Project = {
  id: "project-1",
  title: "测试漫画",
  author: "Demo",
  pageCount: 3,
  totalUnitCount: 15,
  translatedUnitCount: 8,
  provedUnitCount: 3,
  pages: [
    {
      id: "page-1",
      index: 0,
      totalUnitCount: 5,
      translatedUnitCount: 3,
      provedUnitCount: 1,
    },
    {
      id: "page-2",
      index: 1,
      totalUnitCount: 5,
      translatedUnitCount: 3,
      provedUnitCount: 1,
    },
    {
      id: "page-3",
      index: 2,
      totalUnitCount: 5,
      translatedUnitCount: 2,
      provedUnitCount: 1,
    },
  ],
};

const meta: Meta<typeof BaseTranslator> = {
  title: "Features/BaseTranslator",
  component: BaseTranslator,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="h-screen w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BaseTranslator>;

export const WithProofread: Story = {
  args: {
    project: mockProject,
    isCurrUserProofreader: true,
    onLoadUnits: async (_pageId: string) => mockUnits,
    onLoadPageImage: async (_pageId: string) => DEMO_IMAGE,
    onUpsertUnits: async (pageId: string, units: Unit[]) => {
      console.log("[mock] onUpsertUnits", pageId, units);
    },
    onExit: () => {
      console.log("[mock] onExit");
    },
  },
};

export const TranslatorOnly: Story = {
  args: {
    project: mockProject,
    isCurrUserProofreader: false,
    onLoadUnits: async (_pageId: string) => mockUnits,
    onLoadPageImage: async (_pageId: string) => DEMO_IMAGE,
    onUpsertUnits: async (pageId: string, units: Unit[]) => {
      console.log("[mock] onUpsertUnits", pageId, units);
    },
    onExit: () => {
      console.log("[mock] onExit");
    },
  },
};

export const EmptyUnits: Story = {
  args: {
    project: mockProject,
    isCurrUserProofreader: true,
    onLoadUnits: async (_pageId: string) => [],
    onLoadPageImage: async (_pageId: string) => DEMO_IMAGE,
    onUpsertUnits: async (pageId: string, units: Unit[]) => {
      console.log("[mock] onUpsertUnits", pageId, units);
    },
    onExit: () => {
      console.log("[mock] onExit");
    },
  },
};
