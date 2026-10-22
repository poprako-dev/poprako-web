import type { JSX } from "react";
import { AppDialog } from "@/shared/component/AppDialog";
import { Button } from "@/shared/component/Button";
import { LoadingCircle } from "@/shared/component/LoadingCircle";

type Props = {
  error: string | null;
  retryLabel?: string;
  onRetry: () => void;
  onClose: () => void;
};

export function ComicDetailLoadState({
  error,
  retryLabel = "重新加载",
  onRetry,
  onClose,
}: Props): JSX.Element {
  return (
    <AppDialog title="漫画详情" onClose={onClose}>
      <div className="flex min-h-32 flex-col items-center justify-center gap-3">
        {error ? (
          <>
            <p role="alert" className="text-sm text-muted-foreground">
              {error}
            </p>
            <Button onClick={onRetry}>{retryLabel}</Button>
          </>
        ) : (
          <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoadingCircle />
            正在加载漫画详情
          </div>
        )}
      </div>
    </AppDialog>
  );
}
