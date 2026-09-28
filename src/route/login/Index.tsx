import { LoginCard } from "@/route/login/business/LoginCard";
import { Info } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";

export const Route = createFileRoute("/login/")({ component: LoginPage });

function LoginPage(): ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page-paper">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative">
        <LoginCard />

        <div
          role="note"
          className={
            "absolute top-full left-1/2 mt-3 flex w-max -translate-x-1/2 " +
            "items-start gap-2.5 whitespace-nowrap " +
            "rounded-lg bg-surface-green-50 px-4 py-3 " +
            "text-ink-green-600"
          }
        >
          <Info aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
          <p className="text-xs leading-5">自动导入账号的初始密码默认为 123456</p>
        </div>
      </div>
    </div>
  );
}
