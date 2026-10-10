import type { ArtworkImageAllocation } from "@/api/page-artwork/page-artwork-api";
import type { PreparedComposite } from "./artwork-manifest";
export type ArtworkTaskPhase =
  | "queued"
  | "decoding"
  | "encoding"
  | "prepared"
  | "allocating"
  | "packing"
  | "uploading"
  | "confirming"
  | "waiting"
  | "done"
  | "failed"
  | "cancelled";
export type ArtworkTask = {
  id: string;
  name: string;
  kind: "page" | "archive";
  phase: ArtworkTaskPhase;
  progress: number | null;
  error: string | null;
  reused: boolean;
};
export type ArtworkBatchSnapshot = { tasks: ArtworkTask[]; running: boolean; error: string | null };
export type ArtworkPageTask = {
  id: string;
  input: File;
  prepared?: PreparedComposite;
  allocation?: ArtworkImageAllocation;
  putDone: boolean;
  done: boolean;
};
export interface ArtworkBatch {
  getSnapshot: () => ArtworkBatchSnapshot;
  subscribe: (listener: () => void) => () => void;
  run: () => Promise<void>;
  cancel: () => void;
  dispose: () => Promise<void>;
}
export const ARTWORK_PHASE_LABELS: Record<ArtworkTaskPhase, string> = {
  queued: "等待处理",
  decoding: "读取 PSD",
  encoding: "生成 WebP 预览",
  prepared: "预览已准备",
  allocating: "准备上传",
  packing: "打包 PSD",
  uploading: "上传中",
  confirming: "确认上传",
  waiting: "等待页面上传完成",
  done: "已完成",
  failed: "失败",
  cancelled: "已停止",
};
