import { useRef, type ReactElement } from "react";
import { LoaderCircle } from "lucide-react";
import { AppDialogAction } from "@/shared/component/AppDialog";

type Props = {
  disabled: boolean;
  isImporting: boolean;
  onImport: (file: File) => void;
};

export function TermbaseImportButton({ disabled, isImporting, onImport }: Props): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        aria-label="选择术语库 JSON 文件"
        accept=".json,application/json"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file && !disabled) onImport(file);
        }}
      />
      <AppDialogAction
        disabled={disabled}
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        {isImporting && <LoaderCircle size={13} className="animate-spin" />}
        导入
      </AppDialogAction>
    </>
  );
}
