import type { ReactElement } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

type Props = { count: number };
declare function Example(props: Props): ReactElement;
const meta = { component: Example, args: { count: 1 } } satisfies Meta<typeof Example>;
type Story = StoryObj<typeof meta>;
const valid: Story = { args: { count: 2 } };
const invalid: Story = {
  args: {
    // @ts-expect-error Type regression fixture: a string must remain invalid for numeric args.
    count: "invalid",
  },
};
void meta;
void valid;
void invalid;
