import type { JSX } from "react";
import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";
import { previewPosition } from "@/shared/utility/page-geometry";
import { IssueOverlay } from "../issue/IssueOverlay";
import type { useIssueGesture } from "./use-issue-gesture";
import type { RectAction } from "./issue-geometry";

type Props = {
  issues: IssueInfo[];
  selectedId: string | null;
  visible: boolean;
  drawing: boolean;
  disabled: boolean;
  scale: number;
  onSelect: (id: string) => void;
  gesture: ReturnType<typeof useIssueGesture>;
};

export function EditableIssueOverlay(props: Props): JSX.Element {
  const { gesture, selectedId, scale, drawing, visible, disabled } = props;
  const issues = props.issues.map((issue) =>
    gesture.preview?.id === issue.id ? { ...issue, rect: gesture.preview.rect } : issue,
  );
  const selected = issues.find((issue) => issue.id === selectedId);
  return (
    <>
      <IssueOverlay
        scale={scale}
        issues={issues}
        focusedId={selectedId}
        visible={visible}
        onSelect={props.onSelect}
        markerEvents={(issue) =>
          issue.id === selectedId && !disabled && !drawing
            ? {
                ...gesture.events,
                onPointerDown: (event) => {
                  gesture.start(event, "move", issue);
                },
              }
            : {}
        }
      />
      {visible && selected?.rect && !disabled && !drawing && (
        <RectangleHandles issue={selected} scale={scale} gesture={gesture} />
      )}
      {drawing && !disabled && (
        <button
          type="button"
          aria-label="拖动框选标注区域"
          title="拖动框选标注区域 · Esc 取消"
          data-canvas-annotation="drawing"
          className="absolute inset-0 z-40 cursor-crosshair touch-none"
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          onTouchStart={(event) => {
            event.stopPropagation();
          }}
          onPointerDown={(event) => {
            gesture.start(event, "create");
          }}
          {...gesture.events}
        />
      )}
      {drawing && gesture.preview && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-50 border-2 border-outline-stone-500"
          style={previewPosition(gesture.preview.rect)}
        />
      )}
    </>
  );
}

function RectangleHandles({
  issue,
  scale,
  gesture,
}: Pick<Props, "scale" | "gesture"> & { issue: IssueInfo }): JSX.Element | null {
  if (!issue.rect) return null;
  const handles: { action: RectAction; label: string; left: string; top: string }[] = [
    { action: "nw", label: "左上", left: "0%", top: "0%" },
    { action: "ne", label: "右上", left: "100%", top: "0%" },
    { action: "sw", label: "左下", left: "0%", top: "100%" },
    { action: "se", label: "右下", left: "100%", top: "100%" },
    { action: "move", label: "移动", left: "50%", top: "0%" },
  ];
  return (
    <div className="pointer-events-none absolute z-30" style={previewPosition(issue.rect)}>
      {handles.map((handle) => (
        <button
          type="button"
          key={handle.action}
          data-canvas-annotation={issue.id}
          aria-label={`${handle.label} 标注 ${String(issue.index + 1)} 区域`}
          title={handle.label === "移动" ? "拖动移动区域" : `拖动${handle.label}调整区域`}
          className="pointer-events-auto absolute size-3 touch-none rounded-xs border-2 border-line-stone-600 bg-surface-white"
          style={{
            left: handle.left,
            top: handle.top,
            transform: `translate(-50%, -50%) scale(${String(1 / scale)})`,
            cursor: handle.action === "move" ? "move" : `${handle.action}-resize`,
          }}
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          onTouchStart={(event) => {
            event.stopPropagation();
          }}
          onPointerDown={(event) => {
            gesture.start(event, handle.action, issue);
          }}
          {...gesture.events}
        />
      ))}
    </div>
  );
}
