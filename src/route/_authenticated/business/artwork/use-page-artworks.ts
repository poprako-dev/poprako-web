import { useCallback, useEffect, useState } from "react";
import { useApiClient } from "@/route/business/api-context";
import { useAppStore } from "@/route/business/session/session-store";
import { listPageArtworks } from "@/api/page-artwork/page-artwork-api";
import type { PageArtwork } from "./artwork";
import { loadChapterIssues } from "../issue/issue-request";
type Loaded = {
  scope: string;
  key: string;
  pages: PageArtwork[];
  issueCounts: Record<string, number> | null;
  error: string | null;
};

type LoadArgs = {
  client: ReturnType<typeof useApiClient>;
  chapterId: string;
  request: AbortController;
  scope: string;
  key: string;
  setLoaded: React.Dispatch<React.SetStateAction<Loaded | null>>;
};

async function loadPageArtworks({
  client,
  chapterId,
  request,
  scope,
  key,
  setLoaded,
}: LoadArgs): Promise<void> {
  try {
    const [result, issues] = await Promise.allSettled([
      listPageArtworks(client, chapterId, request.signal),
      loadChapterIssues(client, chapterId, request.signal),
    ]);
    if (request.signal.aborted) return;
    const issueCounts: Record<string, number> | null = issues.status === "fulfilled" ? {} : null;
    if (issues.status === "fulfilled" && issueCounts) {
      for (const issue of issues.value) {
        issueCounts[issue.pageArtworkId] = (issueCounts[issue.pageArtworkId] ?? 0) + 1;
      }
    }
    const errors: string[] = [];
    if (result.status === "rejected") errors.push(String(result.reason));
    else if (!result.value.success) errors.push(result.value.error);
    if (issues.status === "rejected") errors.push(`issue 数量加载失败：${String(issues.reason)}`);
    setLoaded((old) => ({
      scope,
      key,
      pages:
        result.status === "fulfilled" && result.value.success
          ? [...result.value.data].sort((a, b) => a.index - b.index)
          : old?.scope === scope
            ? old.pages
            : [],
      issueCounts,
      error: errors.length > 0 ? errors.join("；") : null,
    }));
  } catch (error) {
    if (!request.signal.aborted) {
      setLoaded((old) => ({
        scope,
        key,
        pages: old?.scope === scope ? old.pages : [],
        issueCounts: null,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }
}

export function usePageArtworks(
  chapterId: string | null,
  enabled: boolean,
): {
  pages: PageArtwork[];
  issueCounts: Record<string, number> | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
} {
  const client = useApiClient();
  const generation = useAppStore((state) => state.generation);
  const [revision, setRevision] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const scope = String(chapterId) + ":" + String(generation);
  const key = scope + ":" + String(revision);
  const reload = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);
  useEffect(() => {
    if (!enabled || !chapterId) return;
    const request = new AbortController();
    void loadPageArtworks({ client, chapterId, request, scope, key, setLoaded });
    return () => {
      request.abort();
    };
  }, [client, chapterId, enabled, key, scope]);
  const current = loaded?.key === key;
  return {
    pages: loaded?.scope === scope ? loaded.pages : [],
    issueCounts: current ? loaded.issueCounts : null,
    loading: enabled && chapterId !== null && !current,
    error: current ? loaded.error : null,
    reload,
  };
}
