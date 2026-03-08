import type { Meta, StoryObj } from "@storybook/react-vite";
import ToolboxDropdown from "@/features/ToolboxDropdown";
import {
  User,
  Mail,
  Bell,
  Search,
  Settings,
  Leaf,
  Heart,
  Camera,
} from "lucide-react";

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

export const GreenTheme: Story = {
  args: {
    options: [
      {
        icon: <User size={20} />,
        title: "Account",
        onClick: () => console.log("Account clicked"),
      },
      {
        icon: <Leaf size={20} />,
        title: "Eco Mode",
        onClick: () => console.log("Eco Mode clicked"),
      },
      {
        icon: <Mail size={20} />,
        title: "Messages",
        onClick: () => console.log("Messages clicked"),
      },
      {
        icon: <Bell size={20} />,
        title: "Alerts",
        onClick: () => console.log("Alerts clicked"),
      },
      {
        icon: <Heart size={20} />,
        title: "Likes",
        onClick: () => console.log("Likes clicked"),
      },
      {
        icon: <Search size={20} />,
        title: "Search",
        onClick: () => console.log("Search clicked"),
      },
      {
        icon: <Camera size={20} />,
        title: "Photos",
        onClick: () => console.log("Photos clicked"),
      },
      {
        icon: <Settings size={20} />,
        title: "Settings",
        onClick: () => console.log("Settings clicked"),
      },
    ],
  },
};
