import type { JSX } from "react/jsx-runtime";
import type { ReactNode } from "react";
import { AppDialog } from "@/shared/component/AppDialog";

type Props = {
  title: string;
  children: ReactNode;
  footer: ReactNode;
  locked: boolean;
  onClose: () => void;
};

export function TerminologyDialogFrame({
  title,
  children,
  footer,
  locked,
  onClose,
}: Props): JSX.Element {
  return (
    <AppDialog title={title} footer={footer} locked={locked} onClose={onClose}>
      {children}
    </AppDialog>
  );
}
