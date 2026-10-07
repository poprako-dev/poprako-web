import { useEffect, useState } from "react";
import type { RevisionPage, RevisionPreview } from "./revision-page";
export function useRevisionPreview(
  page: RevisionPage | null,
  layerId: string | null,
  active: boolean,
): {
  image: RevisionPreview | null;
  loading: boolean;
  error: string | null;
} {
  const [result, setResult] = useState<{
    page: RevisionPage;
    layerId: string;
    image: RevisionPreview | null;
    error: string | null;
  } | null>(null);
  useEffect(() => {
    if (!active || !page || !layerId) return;
    const request = new AbortController();
    void page.renderLayer(layerId, request.signal).then(
      (image) => {
        if (!request.signal.aborted) setResult({ page, layerId, image, error: null });
      },
      (error: unknown) => {
        if (!request.signal.aborted)
          setResult({
            page,
            layerId,
            image: null,
            error: error instanceof Error ? error.message : String(error),
          });
      },
    );
    return () => {
      request.abort();
    };
  }, [active, page, layerId]);
  const current = active && result?.page === page && result.layerId === layerId ? result : null;
  return {
    image: current?.image ?? null,
    loading: active && page !== null && layerId !== null && !current,
    error: current?.error ?? null,
  };
}
