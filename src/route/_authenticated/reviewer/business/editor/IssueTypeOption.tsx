import { useRef } from "react";
import type { JSX } from "react";
import { DropdownMenu } from "radix-ui";
import { useLongPress } from "@/shared/hook/use-long-press";

type Props = { type: string; editable: boolean; onEdit: (type: string) => void };

export function IssueTypeOption({ type, editable, onEdit }: Props): JSX.Element {
  const itemRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const cancelledRef = useRef(false);
  const longPress = useLongPress({
    onLongPress: () => {
      cancelledRef.current = true;
      onEdit(type);
    },
    onClick: () => {
      if (!cancelledRef.current) itemRef.current?.click();
    },
  });
  function cancel(): void {
    cancelledRef.current = true;
    longPress.onPointerCancel();
  }
  return (
    <DropdownMenu.RadioItem
      ref={itemRef}
      value={type}
      title={editable ? `${type} · 长按编辑分类` : type}
      onPointerDown={(event) => {
        if (!editable || event.button !== 0) return;
        cancelledRef.current = false;
        originRef.current = { x: event.clientX, y: event.clientY };
        longPress.onPointerDown(event);
      }}
      onPointerUp={(event) => {
        if (!editable) return;
        if (event.button === 0) longPress.onPointerUp(event);
        else event.preventDefault();
      }}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      onPointerMove={(event) => {
        if (
          originRef.current &&
          Math.hypot(event.clientX - originRef.current.x, event.clientY - originRef.current.y) > 8
        )
          cancel();
      }}
      onContextMenu={editable ? longPress.onContextMenu : undefined}
      onKeyDown={() => {
        cancelledRef.current = false;
      }}
      onClick={(event) => {
        if (editable && cancelledRef.current) event.preventDefault();
      }}
      className="flex min-w-0 flex-1 cursor-pointer select-none items-center rounded-sm px-3 py-2 text-xs outline-none data-highlighted:bg-surface-stone-200 data-[state=checked]:bg-surface-green-50 data-[state=checked]:data-highlighted:bg-surface-green-100"
    >
      <span className="truncate">{type}</span>
    </DropdownMenu.RadioItem>
  );
}
