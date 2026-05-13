import { SystemMailViewer } from "@/features/SystemMail";

export default function SystemMailPage() {
  return (
    <div className="min-h-screen flex justify-center bg-[#FEFDF9]">
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
