import { SettingsPanel } from "@/route/_authenticated/_shell/(setting)/business/SettingsPanel";
import { AcknowledgementsFooter } from "@/route/_authenticated/_shell/(setting)/business/AcknowledgementsFooter";

function SettingsPage(): ReactElement {
  return (
    <div className="min-h-screen flex items-start justify-center pt-32 bg-surface-workspace">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(var(--foreground) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative w-full flex flex-col items-center">
        <SettingsPanel />
        <AcknowledgementsFooter />
      </div>
    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_shell/(setting)/settings")({
  component: SettingsPage,
});
import type { ReactElement } from "react";
