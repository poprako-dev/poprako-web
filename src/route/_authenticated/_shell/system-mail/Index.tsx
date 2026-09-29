import { SystemMailViewer } from "@/route/_authenticated/_shell/system-mail/business/SystemMailViewer";

function SystemMailPage(): ReactElement {
  return (
    <div className="min-h-screen flex justify-center bg-page-paper">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative w-full flex justify-center px-4">
        <SystemMailViewer />
      </div>
    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_shell/system-mail/")({
  component: SystemMailPage,
});
import type { ReactElement } from "react";
