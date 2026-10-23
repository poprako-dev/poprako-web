import type { JSX } from "react";
import { LoadingCircle } from "@/shared/component/LoadingCircle";

type Props = {
  error: unknown;
  onReload: () => void;
  onExit: () => void;
};

export function TranslatorModeLoadState({ error, onReload, onExit }: Props): JSX.Element {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      {error ? (
        <>
          <p role="alert" className="text-sm text-destructive">
            加载翻译器失败，请刷新页面重试
          </p>
          <button
            type="button"
            onClick={onReload}
            className="text-sm text-muted-foreground underline transition-colors hover:text-foreground"
          >
            刷新页面
          </button>
          <button
            type="button"
            onClick={onExit}
            className="text-sm text-muted-foreground underline transition-colors hover:text-foreground"
          >
            返回
          </button>
        </>
      ) : (
        <LoadingCircle />
      )}
    </div>
  );
}
