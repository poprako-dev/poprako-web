import type {
  AllocatedPage,
  UploadProgressCallbacks,
} from "@/routes/_authenticated/business/page/page";

export type RuntimeTask = {
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
