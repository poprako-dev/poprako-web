import type { ApiClient } from "@/api/client";
import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { FileDown } from "lucide-react";
import { useApiClient } from "@/route/business/api-context";
import { useAppStore } from "@/route/business/session/session-store";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import { exportArtwork } from "@/api/chapter/artwork-api";
import { ActionButton } from "./ActionButton";
import { sanitizeExportFileName } from "./export-download-utils";
type Props = { chapterId: string; onExported: () => void };
export function ArtworkDownloadButton({ chapterId, onExported }: Props): JSX.Element {
  const client = useApiClient();
  const showToast = useToastStore((state) => state.showToast);
  const generation = useAppStore((state) => state.generation);
  const requestRef = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState<{
    chapterId: string;
    client: ApiClient;
    generation: number;
  } | null>(null);
  useEffect(
    () => () => {
      requestRef.current?.abort();
      requestRef.current = null;
    },
    [chapterId, client, generation],
  );
  async function download(): Promise<void> {
    if (requestRef.current && !requestRef.current.signal.aborted) return;
    const request = new AbortController();
    requestRef.current = request;
    setBusy({ chapterId, client, generation });
    try {
      const result = await exportArtwork(client, chapterId, request.signal);
      if (request.signal.aborted || useAppStore.getState().generation !== generation) return;
      if (!result.success) {
        showLocalApiFailure(result, showToast, "下载嵌稿失败");
        return;
      }
      const link = document.createElement("a");
      link.href = result.data.downloadUrl;
      link.download = sanitizeExportFileName(
        "chapter-" + chapterId + "-artwork." + result.data.ext,
      );
      link.rel = "noopener";
      link.target = "_blank";
      document.body.append(link);
      link.click();
      link.remove();
      onExported();
    } catch (error) {
      if (!request.signal.aborted) {
        console.error("[Artwork] 下载失败", { chapterId, error });
        showLocalCaughtError(error, showToast, "下载嵌稿失败");
      }
    } finally {
      if (requestRef.current === request) {
        requestRef.current = null;
        setBusy(null);
      }
    }
  }
  return (
    <ActionButton
      icon={FileDown}
      title="下载嵌稿"
      disabled={
        busy?.chapterId === chapterId && busy.client === client && busy.generation === generation
      }
      onClick={() => {
        void download();
      }}
    />
  );
}
