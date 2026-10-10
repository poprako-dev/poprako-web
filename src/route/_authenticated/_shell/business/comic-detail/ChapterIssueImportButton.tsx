import { useState } from "react";
import type { JSX } from "react";
import { ClipboardPenLine } from "lucide-react";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { IssueImportDialog } from "@/route/_authenticated/business/issue/IssueImportDialog";
import { ActionButton } from "./ActionButton";

type Props = { chapterId: string; onImported: () => void };

export function ChapterIssueImportButton({ chapterId, onImported }: Props): JSX.Element {
  const showToast = useToastStore((state) => state.showToast);
  const [open, setOpen] = useState(false);
  return (
    <>
      <ActionButton
        icon={ClipboardPenLine}
        title="上传监稿"
        onClick={() => {
          setOpen(true);
        }}
      />
      {open && (
        <IssueImportDialog
          chapterId={chapterId}
          onImported={() => {
            onImported();
            setOpen(false);
            showToast("已替换整章监稿", "success");
          }}
          onClose={() => {
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
