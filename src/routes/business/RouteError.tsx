import { useNavigate } from "@tanstack/react-router";
import type { ReactElement } from "react";

type Props = { error: unknown; reset: () => void };

export function RouteError({ error, reset }: Props): ReactElement {
  const navigate = useNavigate();
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FEFDF9] px-6">
      <section className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-stone-800">页面加载失败</h1>
        <p className="mt-3 text-sm text-stone-600">
          {error instanceof Error ? error.message : "发生了未知错误"}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" className="rounded px-4 py-2" onClick={reset}>
            重试
          </button>
          <button
            type="button"
            className="rounded bg-stone-800 px-4 py-2 text-white"
            onClick={() => {
              void navigate({ to: "/", replace: false });
            }}
          >
            返回首页
          </button>
        </div>
      </section>
    </main>
  );
}

export function RouteNotFound(): ReactElement {
  const navigate = useNavigate();
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FEFDF9] px-6">
      <section className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-stone-800">页面不存在</h1>
        <p className="mt-3 text-sm text-stone-600">请检查网址，或返回工作区继续使用。</p>
        <button
          type="button"
          className="mt-6 rounded bg-stone-800 px-4 py-2 text-white"
          onClick={() => {
            void navigate({ to: "/" });
          }}
        >
          返回首页
        </button>
      </section>
    </main>
  );
}
