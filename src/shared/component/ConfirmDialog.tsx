import type { ReactElement, ReactNode } from "react";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { AppDialog, AppDialogAction } from "@/shared/component/AppDialog";

type CommonProps = {
  title: string;
  description?: string;
  onCancel: () => void;
};

type Props = CommonProps &
  (
    | {
        mode?: "confirm";
        children?: ReactNode;
        onConfirm: () => void;
        confirmLabel?: string;
        cancelLabel?: string;
        loading?: boolean;
        confirmDisabled?: boolean;
        confirmTone?: "danger" | "success";
      }
    | { mode: "content"; children: ReactElement }
  );

export function ConfirmDialog(props: Props): ReactElement {
  return (
    <AppDialog
      title={props.title}
      {...(props.description === undefined ? {} : { description: props.description })}
      size="compact"
      tone="warning"
      onClose={props.onCancel}
      bodyClassName={props.children ? "p-0" : "hidden"}
      footer={
        props.mode === "content" ? null : (
          <div className="flex items-center gap-2">
            <AppDialogAction onClick={props.onCancel}>
              {props.cancelLabel ?? "取消"}
            </AppDialogAction>
            <AppDialogAction
              tone={props.confirmTone === "success" ? "brand" : "danger"}
              onClick={props.onConfirm}
              disabled={(props.loading ?? false) || (props.confirmDisabled ?? false)}
            >
              {props.loading ? <LoadingCircle /> : (props.confirmLabel ?? "确认")}
            </AppDialogAction>
          </div>
        )
      }
    >
      {props.children}
    </AppDialog>
  );
}
