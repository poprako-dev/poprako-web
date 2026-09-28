import { SettingsPanel } from "@/routes/_authenticated/_shell/settings/business/SettingsPanel";
import { AcknowledgementsFooter } from "@/routes/_authenticated/_shell/settings/business/AcknowledgementsFooter";

export function SettingsPage(): ReactElement {
  return (
    <div className="min-h-screen flex items-start justify-center pt-32 bg-[#FEFDF9]">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 0)",
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

export const Route = createFileRoute("/_authenticated/_shell/settings/")({
  component: SettingsPage,
});
import type { ReactElement } from "react";
