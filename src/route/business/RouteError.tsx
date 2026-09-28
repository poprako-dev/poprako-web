import { useNavigate } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { Button } from "@/shared/component/Button";

type Props = { error: unknown; reset: () => void };

export function RouteError({ error, reset }: Props): ReactElement {
  const navigate = useNavigate();
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-foreground">页面加载失败</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "发生了未知错误"}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={reset}>
            重试
          </Button>
          <Button
            onClick={() => {
              void navigate({ to: "/", replace: false });
            }}
          >
            返回首页
          </Button>
        </div>
      </section>
    </main>
  );
}

export function RouteNotFound(): ReactElement {
  const navigate = useNavigate();
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-foreground">页面不存在</h1>
        <p className="mt-3 text-sm text-muted-foreground">请检查网址，或返回工作区继续使用。</p>
        <Button
          onClick={() => {
            void navigate({ to: "/" });
          }}
        >
          返回首页
        </Button>
      </section>
    </main>
  );
}
