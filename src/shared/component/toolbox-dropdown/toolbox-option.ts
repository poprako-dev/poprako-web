import type { ReactElement } from "react";

export type ToolboxOption = {
  icon: ReactElement;
  title: string;
  onClick: () => void;
};
