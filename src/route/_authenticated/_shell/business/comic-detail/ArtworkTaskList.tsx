import type { JSX } from "react";
import { Check, CircleAlert, LoaderCircle, FileArchive, FileImage } from "lucide-react";
import type { ArtworkTask } from "./upload/artwork-batch-types";
import { ARTWORK_PHASE_LABELS } from "./upload/artwork-batch-types";
type Props = { tasks: readonly ArtworkTask[] };
export function ArtworkTaskList({ tasks }: Props): JSX.Element {
  const completed = tasks.filter((task) => task.phase === "done").length;
  return (
    <div className="mt-4 flex min-h-0 flex-col gap-3">
      <p role="status" className="shrink-0 text-xs text-text-muted-cool">
        已完成 {completed} / {tasks.length}
      </p>
      <div className="min-h-0 overflow-y-auto" role="region" aria-label="嵌稿上传进度" tabIndex={0}>
        <ul className="space-y-2" aria-label="嵌稿上传任务">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="rounded-md border border-line-stone-200 bg-surface-stone-50 p-3 text-xs text-ink-stone-700"
            >
              <div className="flex items-center gap-2">
                {task.kind === "archive" ? <FileArchive size={16} /> : <FileImage size={16} />}
                <span className="min-w-0 flex-1 break-all">{task.name}</span>
                {task.phase === "done" ? (
                  <Check size={14} />
                ) : task.phase === "failed" ? (
                  <CircleAlert size={14} />
                ) : !["queued", "cancelled", "prepared", "waiting"].includes(task.phase) ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : null}
              </div>
              <p className="mt-1">
                {task.reused
                  ? "已复用"
                  : task.phase === "prepared" && task.kind === "archive"
                    ? "压缩包已准备"
                    : ARTWORK_PHASE_LABELS[task.phase]}
                {task.progress !== null && task.phase !== "done"
                  ? " · " + String(Math.floor(task.progress)) + "%"
                  : ""}
              </p>
              {task.progress !== null && task.phase !== "done" && (
                <progress
                  aria-label={task.name + "进度"}
                  value={task.progress}
                  max={100}
                  className="mt-2 h-1.5 w-full accent-primary"
                />
              )}
              {task.error && <p className="mt-1 break-words text-text-danger">{task.error}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
