import { SettingsPanel, AcknowledgementsFooter } from "@/features/Settings";

type Props = Record<string, never>;

export default function SettingsPage(_: Props) {
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
