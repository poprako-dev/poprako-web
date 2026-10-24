import type { JSX, ReactNode } from "react";
import { Eye, MapPin, Save, Undo2, Loader2 } from "lucide-react";
import clsx from "clsx";

type Props = {
  relocation: boolean;
  visible: boolean;
  disabled: boolean;
  canUndo: boolean;
  saving: boolean;
  status: string;
  onRelocate: () => void;
  onVisible: () => void;
  onSave: () => void;
  onUndo: () => void;
};
type Tool = {
  id?: string;
  label: string;
  icon: ReactNode;
  run: () => void;
  active?: boolean;
  disabled?: boolean;
};

export function ReviewEditorToolbar(props: Props): JSX.Element {
  const tools: Tool[] = [
    {
      id: "save",
      label: `保存 · ${props.status}`,
      icon: props.saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />,
      run: props.onSave,
      disabled: props.disabled,
    },
    {
      label: "万能回退",
      icon: <Undo2 size={18} />,
      run: props.onUndo,
      disabled: props.disabled || !props.canUndo,
    },
    {
      label: "切换重定位模式",
      icon: <MapPin size={18} />,
      run: props.onRelocate,
      active: props.relocation,
    },
    {
      label: "切换标注矩形显示",
      icon: <Eye size={18} />,
      run: props.onVisible,
      active: props.visible,
    },
  ];
  return (
    <div className="relative z-30 shrink-0 border-b-2 border-line-stone-200 bg-surface-stone-50">
      <div className="flex w-full divide-x divide-separator-stone-200">
        {tools.map((tool) => (
          <button
            key={tool.id ?? tool.label}
            type="button"
            title={tool.label}
            aria-label={tool.label}
            aria-pressed={tool.active}
            disabled={tool.disabled}
            onClick={tool.run}
            className={clsx(
              "flex flex-1 items-center justify-center py-2 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] disabled:cursor-not-allowed disabled:opacity-40",
              tool.active
                ? "bg-surface-green-50 text-ink-green-800 hover:bg-surface-green-100"
                : "bg-surface-white text-ink-stone-600 hover:bg-surface-stone-100",
            )}
          >
            {tool.icon}
          </button>
        ))}
      </div>
      <span role="status" className="sr-only">
        {props.status}
      </span>
    </div>
  );
}
