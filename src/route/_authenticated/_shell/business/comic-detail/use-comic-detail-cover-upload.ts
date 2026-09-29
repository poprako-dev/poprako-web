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
  const displayedCoverUrl = resolveComicDetailCoverUrl({
    isCoverUploaded,
    comicCoverThumbnailUrl,
    selectedChapterIndex,
    pages,
  });

  useEffect(() => {
    const unsubscribe = useAppStore.subscribe((state, previous) => {
      if (state.generation !== previous.generation) {
        controllerRef.current?.abort();
      }
    });
    return () => {
      unsubscribe();
      controllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (localCoverUrl) URL.revokeObjectURL(localCoverUrl);
    };
  }, [localCoverUrl]);

  const handleUploadCover = useCallback(
    async (file: File): Promise<void> => {
      if (isUploadingCover) return;
      const sessionGeneration = useAppStore.getState().generation;
      const controller = new AbortController();
      controllerRef.current = controller;
      const assertCurrentSession = (): void => {
        if (useAppStore.getState().generation !== sessionGeneration) {
          throw new Error("会话已变更，封面上传已取消");
        }
      };
      const ext = getFileExtension(file);
      if (!ext) {
        showToast("请选择带后缀的图片文件", "error");
        return;
      }

      setIsUploadingCover(true);
      setCoverUploadProgress(0);
      try {
        const { imageHash } = await hashPageFile(file);
        assertCurrentSession();
        const allocRes = await allocCoverUpload(client, comicId, {
          imageHash,
          newByteLen: file.size,
          extension: ext,
        });
        assertCurrentSession();
        if (!allocRes.success) {
          showLocalApiFailure(allocRes, showToast);
          return;
        }

        const slot = allocRes.data;
        if (slot === null) {
          showToast("封面图片未发生变化", "success");
          return;
        }

        const uploadRes = await client.putPresigned({
          url: slot.putUrl,
          file,
          headers: slot.headers,
          onProgress: (percent) => {
            if (useAppStore.getState().generation === sessionGeneration) {
              setCoverUploadProgress(percent);
            }
          },
          signal: controller.signal,
        });
        assertCurrentSession();
        if (!uploadRes.success) {
          showLocalApiFailure(uploadRes, showToast);
          return;
        }

        const markRes = await markCoverUploaded(client, comicId, slot.imageVersion);
        assertCurrentSession();
        if (!markRes.success) {
          showLocalApiFailure(markRes, showToast);
          return;
        }

        setLocalCoverUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return URL.createObjectURL(file);
        });
        showToast("封面上传成功", "success");
      } catch (error) {
        if (useAppStore.getState().generation === sessionGeneration) {
          console.error("[ComicDetailModal] 封面上传异常:", error);
          showLocalCaughtError(error, showToast, "封面上传失败", true);
        }
      } finally {
        if (useAppStore.getState().generation === sessionGeneration) {
          setIsUploadingCover(false);
          setCoverUploadProgress(null);
        }
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    },
    [client, comicId, isUploadingCover, showToast],
  );

  const handleCoverFileChange: CoverUploadState["handleCoverFileChange"] = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) void handleUploadCover(file);
    },
    [handleUploadCover],
  );

  return {
    canUploadCover,
    coverUpload: {
      isUploadingCover,
      coverUploadProgress,
      localCoverUrl: localCoverUrl ?? displayedCoverUrl,
      handleCoverFileChange,
    },
  };
}
