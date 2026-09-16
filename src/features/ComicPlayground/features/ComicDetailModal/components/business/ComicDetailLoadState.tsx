import AppDialog from "@/components/ui/AppDialog";
import { Button } from "@/components/ui/button";
import LoadingCircle from "@/components/ui/LoadingCircle";

interface Props {
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
}

export default function ComicDetailLoadState({ error, onRetry, onClose }: Props) {
  return (
    <AppDialog title="漫画详情" onClose={onClose}>
      <div className="flex min-h-32 flex-col items-center justify-center gap-3">
        {error ? (
          <>
            <p role="alert" className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={onRetry}>重新加载</Button>
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
