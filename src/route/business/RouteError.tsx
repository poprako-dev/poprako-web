import { useNavigate } from "@tanstack/react-router";
import { TreePine } from "lucide-react";
import clsx from "clsx";
import type { ReactElement } from "react";

type Props = { error: unknown; reset: () => void };
type ErrorViewProps = {
  code: string;
  title: string;
  message: string;
  onGoHome: () => void;
  retry: (() => void) | null;
};

function ErrorView({ code, title, message, onGoHome, retry }: ErrorViewProps): ReactElement {
  return (
    <main
      className={clsx(
        "min-h-screen w-full flex flex-col items-center justify-center",
        "bg-page-paper px-4 sm:px-6 lg:px-8",
        "selection:bg-surface-emerald-100 selection:text-ink-emerald-700",
      )}
    >
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-surface-emerald-50 animate-pulse">
        <TreePine className="h-10 w-10 text-ink-emerald-500" aria-hidden />
      </div>
      <p className="mb-2 text-sm font-medium tracking-widest uppercase text-text-emerald">{code}</p>
      <h1 className="mb-4 text-3xl font-light tracking-tight text-ink-slate-800 sm:text-4xl">
        {title}
      </h1>
      <p className="mb-10 max-w-md text-center text-base leading-relaxed text-text-muted-cool">
        {message}
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
        {retry && (
          <button
            type="button"
            onClick={retry}
            className={clsx(
              "inline-flex items-center justify-center rounded-full bg-surface-white px-8 py-3",
              "text-sm font-medium text-text-muted-cool border border-line-slate-200",
              "transition-colors duration-200 hover:bg-surface-slate-50 hover:text-ink-slate-700",
            )}
          >
            重试
          </button>
        )}
        <button
          type="button"
          onClick={onGoHome}
          className={clsx(
            "inline-flex items-center justify-center rounded-full",
            "border-2 border-line-emerald-300/50 px-8 py-3 text-sm font-medium text-text-emerald",
            "transition-colors duration-200 hover:text-text-emerald",
            "focus:outline-none focus:ring-2 focus:ring-focus-emerald-500 focus:ring-offset-2",
          )}
        >
          返回首页
        </button>
      </div>
    </main>
  );
}

export function RouteError({ error, reset }: Props): ReactElement {
  const navigate = useNavigate();
  return (
    <ErrorView
      code="500"
      title="页面加载失败"
      message={error instanceof Error ? error.message : "发生了未知错误"}
      retry={reset}
      onGoHome={() => {
        void navigate({ to: "/", replace: false });
      }}
    />
  );
}

export function RouteNotFound(): ReactElement {
  const navigate = useNavigate();
  return (
    <ErrorView
      code="404"
      title="页面未找到"
      message="抱歉，似乎白杨子还没有支持这个页面哦 TvT"
      retry={null}
      onGoHome={() => {
        void navigate({ to: "/" });
      }}
    />
  );
}
