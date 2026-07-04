import type { Meta, StoryObj } from "@storybook/react-vite"

import { fn } from "storybook/test"

import { Button } from "@/components/ui/button"

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
    disabled: { control: "boolean" },
  },
  args: {
    children: "Button",
    variant: "default",
    size: "default",
    disabled: false,
    onClick: fn(),
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { variant: "default" } }
export const Destructive: Story = { args: { variant: "destructive" } }
export const Outline: Story = { args: { variant: "outline" } }
export const Secondary: Story = { args: { variant: "secondary" } }
export const Ghost: Story = { args: { variant: "ghost" } }
export const Link: Story = { args: { variant: "link" } }

export const SizeXs: Story = { args: { size: "xs", children: "XS" } }
export const SizeSm: Story = { args: { size: "sm", children: "SM" } }
export const SizeLg: Story = { args: { size: "lg", children: "LG" } }
export const SizeIcon: Story = { args: { size: "icon", children: "✓" } }
