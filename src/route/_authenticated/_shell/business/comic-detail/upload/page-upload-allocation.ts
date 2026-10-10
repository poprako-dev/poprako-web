import { allocChapterPages, listPages } from "@/route/_authenticated/business/page/page-request";
import type {
  AllocatedPage,
  PageImageInput,
  PageInfo,
  UploadProgressCallbacks,
} from "@/route/_authenticated/business/page/page";
import type { ApiClient } from "@/api/client";
import { toApiRequestError } from "@/route/business/request-error";
import { bumpPageUploadChapterRevision } from "./page-upload-store";
import {
  assertSessionGeneration,
  enqueueTask,
  patchTask,
  type RuntimeTask,
  summarizeTaskCompletions,
} from "./page-upload-runtime";
import type { PreparedFile } from "./page-upload-types";
import type { StartPageUploadResult } from "./page-upload-types";
import type { TaskOutcome } from "./page-upload-types";

type ExistingManifestEntry = { pageId: string; imageHash: string; extension: string };
type AllocationPlan = {
  manifest: ExistingManifestEntry[];
  preparedFilesByPageId: Map<string, PreparedFile>;
  newFiles: PreparedFile[];
};

function imageIdentity(imageHash: string, extension: string): string {
  return JSON.stringify([imageHash, extension.toLowerCase()]);
}

function existingManifest(pages: PageInfo[]): ExistingManifestEntry[] {
  return pages.map((page) => {
    if (!page.imageHash || !page.extension) {
      throw new Error(`页面 ${page.id} 缺少图片身份信息，请刷新后重试`);
    }
    return { pageId: page.id, imageHash: page.imageHash, extension: page.extension };
  });
}

function matchPreparedFiles(
  manifest: ExistingManifestEntry[],
  preparedFiles: PreparedFile[],
): AllocationPlan {
  const pagesByIdentity = new Map<string, ExistingManifestEntry[]>();
  for (const page of manifest) {
    const identity = imageIdentity(page.imageHash, page.extension);
    const matchingPages = pagesByIdentity.get(identity) ?? [];
    matchingPages.push(page);
    pagesByIdentity.set(identity, matchingPages);
  }
  const preparedFilesByPageId = new Map<string, PreparedFile>();
  const newFiles: PreparedFile[] = [];
  for (const prepared of preparedFiles) {
    const matchingPage = pagesByIdentity
      .get(imageIdentity(prepared.imageHash, prepared.extension))
      ?.shift();
    if (matchingPage) preparedFilesByPageId.set(matchingPage.pageId, prepared);
    else newFiles.push(prepared);
  }
  return { manifest, preparedFilesByPageId, newFiles };
}

function allocationInputs(plan: AllocationPlan): PageImageInput[] {
  const existing = plan.manifest.map((page) => {
    const prepared = plan.preparedFilesByPageId.get(page.pageId);
    if (!prepared) return page;
    return {
      pageId: page.pageId,
      rawIdent: prepared.file.name,
      imageHash: page.imageHash,
      newByteLen: prepared.file.size,
      extension: page.extension,
    };
  });
  const added = plan.newFiles.map((prepared) => ({
    rawIdent: prepared.file.name,
    imageHash: prepared.imageHash,
    newByteLen: prepared.file.size,
    extension: prepared.extension,
  }));
  return [...existing, ...added];
}

function queueAllocatedPages(
  pages: AllocatedPage[],
  plan: AllocationPlan,
  callbacks: UploadProgressCallbacks | undefined,
  client: ApiClient,
  chapterId: string,
  batchId: string,
  logPrefix: string,
  sessionGeneration: number,
): {
  uploadPages: { page: AllocatedPage; prepared: PreparedFile }[];
  completions: Promise<TaskOutcome>[];
} {
  const uploadPages = collectAllocatedUploads(pages, plan, sessionGeneration);
  callbacks?.onPagesAllocated(
    uploadPages.map(({ page, prepared }) => ({
      pageId: page.pageId,
      index: page.index,
      fileIndex: prepared.fileIndex,
    })),
  );
  const completions = uploadPages.map(({ page, prepared }) =>
    enqueueAllocatedPage({
      page,
      prepared,
      callbacks,
      client,
      chapterId,
      batchId,
      logPrefix,
      sessionGeneration,
    }),
  );
  return { uploadPages, completions };
}

function collectAllocatedUploads(
  pages: AllocatedPage[],
  plan: AllocationPlan,
  sessionGeneration: number,
): { page: AllocatedPage; prepared: PreparedFile }[] {
  const uploadPages: { page: AllocatedPage; prepared: PreparedFile }[] = [];
  for (const [index, page] of pages.entries()) {
    const prepared =
      index < plan.manifest.length
        ? plan.preparedFilesByPageId.get(page.pageId)
        : plan.newFiles[index - plan.manifest.length];
    if (!prepared) continue;
    if (page.slot) {
      uploadPages.push({ page, prepared });
      continue;
    }
    patchTask(prepared.taskId, sessionGeneration, {
      pageId: page.pageId,
      index: page.index,
      status: "succeeded",
      progress: 100,
      error: null,
    });
  }
  return uploadPages;
}

function enqueueAllocatedPage(args: {
  page: AllocatedPage;
  prepared: PreparedFile;
  callbacks: UploadProgressCallbacks | undefined;
  client: ApiClient;
  chapterId: string;
  batchId: string;
  logPrefix: string;
  sessionGeneration: number;
}): Promise<TaskOutcome> {
  const { page, prepared } = args;
  patchTask(prepared.taskId, args.sessionGeneration, {
    pageId: page.pageId,
    index: page.index,
    status: "queued",
  });
  const runtimeTask: RuntimeTask = {
    client: args.client,
    taskId: prepared.taskId,
    batchId: args.batchId,
    chapterId: args.chapterId,
    pageId: page.pageId,
    file: prepared.file,
    imageHash: page.imageHash,
    extension: page.extension,
    slot: page.slot,
    callbacks: args.callbacks,
    logPrefix: args.logPrefix,
    abortController: new AbortController(),
    cancelled: false,
    sessionGeneration: args.sessionGeneration,
  };
  return enqueueTask(runtimeTask);
}

async function allocatePages(args: {
  client: ApiClient;
  chapterId: string;
  plan: AllocationPlan;
}): Promise<AllocatedPage[]> {
  const result = await allocChapterPages(args.client, {
    chapterId: args.chapterId,
    pages: allocationInputs(args.plan),
  });
  if (!result.success) throw toApiRequestError(result);
  if (result.data.pages.length !== args.plan.manifest.length + args.plan.newFiles.length) {
    throw new Error("分配页面数量与清单数量不一致");
  }
  return result.data.pages;
}

export async function runPageUploadAllocation(args: {
  client: ApiClient;
  chapterId: string;
  preparedFiles: PreparedFile[];
  callbacks: UploadProgressCallbacks | undefined;
  batchId: string;
  logPrefix: string;
  sessionGeneration: number;
}): Promise<StartPageUploadResult> {
  assertSessionGeneration(args.sessionGeneration);
  const pagesResult = await listPages(args.client, { chapterId: args.chapterId });
  assertSessionGeneration(args.sessionGeneration);
  if (!pagesResult.success) throw toApiRequestError(pagesResult);
  const plan = matchPreparedFiles(existingManifest(pagesResult.data), args.preparedFiles);
  const pages = await allocatePages({ client: args.client, chapterId: args.chapterId, plan });
  assertSessionGeneration(args.sessionGeneration);
  const { uploadPages, completions } = queueAllocatedPages(
    pages,
    plan,
    args.callbacks,
    args.client,
    args.chapterId,
    args.batchId,
    args.logPrefix,
    args.sessionGeneration,
  );
  bumpPageUploadChapterRevision(args.chapterId);
  return {
    batchId: args.batchId,
    allocatedCount: uploadPages.length,
    skippedCount: args.preparedFiles.length - uploadPages.length,
    completion: summarizeTaskCompletions(completions),
  };
}
