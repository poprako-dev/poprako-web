import { useCallback, useEffect, useRef, useState } from "react";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import {
  allocCoverUpload,
  markCoverUploaded,
} from "@/route/_authenticated/business/comic/comic-request";
import { useApiClient } from "@/route/business/api-context";
import { hashPageFile } from "@/shared/utility/hash/image-hash";
import { hasRole } from "@/route/business/identity/role";
import type { MemberInfo } from "@/route/business/identity/member";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { CoverUploadState } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";
import { getFileExtension } from "@/route/_authenticated/_shell/business/comic-detail/utils";
import { resolveComicDetailCoverUrl } from "@/route/_authenticated/_shell/business/comic-detail/cover-url";
import { useAppStore } from "@/route/business/session/session-store";
import type { Dispatch, RefObject, SetStateAction } from "react";

type Args = {
  comicId: string;
  comicCoverThumbnailUrl?: string | null | undefined;
  isCoverUploaded: boolean;
  selectedChapterIndex: number | undefined;
  pages: PageInfo[];
  activeMember: MemberInfo | null;
  canUploadRawPages: boolean;
  showToast: (message: string, type: ToastType) => void;
};

type CoverUpload = {
  canUploadCover: boolean;
  coverUpload: CoverUploadState;
};

type CoverUploadExecutionArgs = {
  client: ReturnType<typeof useApiClient>;
  comicId: string;
  file: File;
  extension: string;
  controller: AbortController;
  sessionGeneration: number;
  setProgress: Dispatch<SetStateAction<number | null>>;
  showToast: Args["showToast"];
};

type CoverUploadHandlerArgs = {
  client: ReturnType<typeof useApiClient>;
  comicId: string;
  isUploadingCover: boolean;
  controllerRef: RefObject<AbortController | null>;
  setIsUploadingCover: Dispatch<SetStateAction<boolean>>;
  setCoverUploadProgress: Dispatch<SetStateAction<number | null>>;
  setLocalCoverUrl: Dispatch<SetStateAction<string | null>>;
  showToast: Args["showToast"];
};

function currentCoverSession(generation: number): boolean {
  return useAppStore.getState().generation === generation;
}

function publishCoverPreview(
  file: File,
  setLocalCoverUrl: CoverUploadHandlerArgs["setLocalCoverUrl"],
  showToast: Args["showToast"],
): void {
  setLocalCoverUrl((previous) => {
    if (previous) URL.revokeObjectURL(previous);
    return URL.createObjectURL(file);
  });
  showToast("封面上传成功", "success");
}

function finishCoverUpload(
  args: CoverUploadHandlerArgs,
  sessionGeneration: number,
  controller: AbortController,
): void {
  if (currentCoverSession(sessionGeneration)) {
    args.setIsUploadingCover(false);
    args.setCoverUploadProgress(null);
  }
  if (args.controllerRef.current === controller) args.controllerRef.current = null;
}

async function uploadCoverFile(file: File, args: CoverUploadHandlerArgs): Promise<void> {
  if (args.isUploadingCover) return;
  const sessionGeneration = useAppStore.getState().generation;
  const controller = new AbortController();
  args.controllerRef.current = controller;
  const extension = getFileExtension(file);
  if (!extension) {
    args.showToast("请选择带后缀的图片文件", "error");
    return;
  }
  args.setIsUploadingCover(true);
  args.setCoverUploadProgress(0);
  try {
    const isUploaded = await executeCoverUpload({
      client: args.client,
      comicId: args.comicId,
      file,
      extension,
      controller,
      sessionGeneration,
      setProgress: args.setCoverUploadProgress,
      showToast: args.showToast,
    });
    if (!isUploaded) return;
    publishCoverPreview(file, args.setLocalCoverUrl, args.showToast);
  } catch (error) {
    if (currentCoverSession(sessionGeneration)) {
      console.error("[ComicDetailModal] 封面上传异常:", error);
      showLocalCaughtError(error, args.showToast, "封面上传失败", true);
    }
  } finally {
    finishCoverUpload(args, sessionGeneration, controller);
  }
}

async function executeCoverUpload({
  client,
  comicId,
  file,
  extension,
  controller,
  sessionGeneration,
  setProgress,
  showToast,
}: CoverUploadExecutionArgs): Promise<boolean> {
  const { imageHash } = await hashPageFile(file);
  assertCoverSessionCurrent(sessionGeneration);
  const allocation = await allocCoverUpload(client, comicId, {
    imageHash,
    newByteLen: file.size,
    extension,
  });
  assertCoverSessionCurrent(sessionGeneration);
  if (!allocation.success) {
    showLocalApiFailure(allocation, showToast);
    return false;
  }
  const slot = allocation.data;
  if (slot === null) {
    showToast("封面图片未发生变化", "success");
    return false;
  }
  const upload = await client.putPresigned({
    url: slot.putUrl,
    file,
    headers: slot.headers,
    onProgress: (percent) => {
      if (useAppStore.getState().generation === sessionGeneration) setProgress(percent);
    },
    signal: controller.signal,
  });
  assertCoverSessionCurrent(sessionGeneration);
  if (!upload.success) {
    showLocalApiFailure(upload, showToast);
    return false;
  }
  const marked = await markCoverUploaded(client, comicId, slot.imageVersion);
  assertCoverSessionCurrent(sessionGeneration);
  if (!marked.success) {
    showLocalApiFailure(marked, showToast);
    return false;
  }
  return true;
}

function useCoverUploadSessionGuard(controllerRef: RefObject<AbortController | null>): void {
  useEffect(() => {
    const abortCurrentController = (): void => {
      abortCoverUpload(controllerRef);
    };
    const unsubscribe = useAppStore.subscribe((state, previous) => {
      if (state.generation !== previous.generation) abortCurrentController();
    });
    return () => {
      unsubscribe();
      abortCurrentController();
    };
  }, [controllerRef]);
}

function abortCoverUpload(controllerRef: RefObject<AbortController | null>): void {
  controllerRef.current?.abort();
}

function useCoverPreviewCleanup(localCoverUrl: string | null): void {
  useEffect(() => {
    return () => {
      if (localCoverUrl) URL.revokeObjectURL(localCoverUrl);
    };
  }, [localCoverUrl]);
}

function displayedCoverUrl(
  isCoverUploaded: boolean,
  comicCoverThumbnailUrl: string | null | undefined,
  selectedChapterIndex: number | undefined,
  pages: PageInfo[],
): string | null {
  return resolveComicDetailCoverUrl({
    isCoverUploaded,
    comicCoverThumbnailUrl,
    selectedChapterIndex,
    pages,
  });
}

function assertCoverSessionCurrent(sessionGeneration: number): void {
  if (!currentCoverSession(sessionGeneration)) throw new Error("会话已变更，封面上传已取消");
}

function useCoverInputHandler(
  handleUploadCover: (file: File) => Promise<void>,
): CoverUploadState["handleCoverFileChange"] {
  return useCallback(
    (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) void handleUploadCover(file);
    },
    [handleUploadCover],
  );
}

function useCoverUploadAction(args: CoverUploadHandlerArgs): (file: File) => Promise<void> {
  return useCallback((file: File) => uploadCoverFile(file, args), [args]);
}

function createCoverUploadResult(
  canUploadCover: boolean,
  isUploadingCover: boolean,
  coverUploadProgress: number | null,
  localCoverUrl: string | null,
  coverUrl: string | null,
  handleCoverFileChange: CoverUploadState["handleCoverFileChange"],
): CoverUpload {
  return {
    canUploadCover,
    coverUpload: {
      isUploadingCover,
      coverUploadProgress,
      localCoverUrl: localCoverUrl ?? coverUrl,
      handleCoverFileChange,
    },
  };
}

export function useComicDetailCoverUpload({
  comicId,
  comicCoverThumbnailUrl,
  isCoverUploaded,
  selectedChapterIndex,
  pages,
  activeMember,
  canUploadRawPages,
  showToast,
}: Args): CoverUpload {
  const client = useApiClient();
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState<number | null>(null);
  const [localCoverUrl, setLocalCoverUrl] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const canUploadCover =
    (activeMember !== null && hasRole(activeMember, "admin")) || canUploadRawPages;
  const coverUrl = displayedCoverUrl(
    isCoverUploaded,
    comicCoverThumbnailUrl,
    selectedChapterIndex,
    pages,
  );

  useCoverUploadSessionGuard(controllerRef);
  useCoverPreviewCleanup(localCoverUrl);

  const handleUploadCover = useCoverUploadAction({
    client,
    comicId,
    isUploadingCover,
    controllerRef,
    setIsUploadingCover,
    setCoverUploadProgress,
    setLocalCoverUrl,
    showToast,
  });

  const handleCoverFileChange = useCoverInputHandler(handleUploadCover);

  return createCoverUploadResult(
    canUploadCover,
    isUploadingCover,
    coverUploadProgress,
    localCoverUrl,
    coverUrl,
    handleCoverFileChange,
  );
}
