import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ToolboxDropdown } from "@/shared/component/toolbox-dropdown/ToolboxDropdown";
import { User, Mail, Bell, Search, Settings, Leaf, Heart, Camera } from "lucide-react";

const meta: Meta<typeof ToolboxDropdown> = {
  title: "Features/ToolboxDropdown",
  component: ToolboxDropdown,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ToolboxDropdown>;

export const Default: Story = {
  args: {
    options: [
      {
        icon: <User size={20} />,
        title: "Account",
        onClick: fn(),
      },
      {
        icon: <Leaf size={20} />,
        title: "Eco Mode",
        onClick: fn(),
      },
      {
        icon: <Mail size={20} />,
        title: "Messages",
        onClick: fn(),
      },
      {
        icon: <Bell size={20} />,
        title: "Alerts",
        onClick: fn(),
      },
      {
        icon: <Heart size={20} />,
        title: "Likes",
        onClick: fn(),
      },
      {
        icon: <Search size={20} />,
        title: "Search",
        onClick: fn(),
      },
      {
        icon: <Camera size={20} />,
        title: "Photos",
        onClick: fn(),
      },
      {
        icon: <Settings size={20} />,
        title: "Settings",
        onClick: fn(),
      },
    ],
  },
};
