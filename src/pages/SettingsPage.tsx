import { SettingsPanel } from "@/features/Settings";

type Props = {};

export default function SettingsPage({}: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FEFDF9]">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative w-full flex justify-center">
        <SettingsPanel />
      </div>
    </div>
  );
}
