import type { ReactNode } from "react";

export type ToolboxOption = {
  icon: ReactNode;
  title: string;
  onClick: () => Promise<void> | void;
};
