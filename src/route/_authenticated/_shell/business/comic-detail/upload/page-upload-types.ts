import type {
  AllocatedPage,
  UploadProgressCallbacks,
} from "@/route/_authenticated/business/page/page";
import type { ApiClient } from "@/api/client";

export type PreparedFile = {
  taskId: string;
  file: File;
  imageHash: string;
  extension: string;
  fileIndex: number;
  sessionGeneration: number;
};

export type RuntimeTask = {
  client: ApiClient;
  taskId: string;
  batchId: string;
  chapterId: string;
  pageId: string;
  file: File;
  imageHash: string;
  extension: string;
  slot: AllocatedPage["slot"] | undefined;
  callbacks?: UploadProgressCallbacks | undefined;
  logPrefix: string;
  abortController: AbortController;
  cancelled: boolean;
  sessionGeneration: number;
};

export type TaskOutcome = {
  succeeded: boolean;
  reportedValidationError: boolean;
};

export type QueueEntry = {
  task: RuntimeTask;
  resolve: (outcome: TaskOutcome) => void;
};

export type PageUploadBatchSummary = {
  succeeded: number;
  failed: number;
  reportedValidationFailures: number;
};

export type StartPageUploadResult = {
  batchId: string;
  allocatedCount: number;
  skippedCount: number;
  completion: Promise<PageUploadBatchSummary>;
};
