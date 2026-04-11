import { LoginCard } from "@/features/LoginCard";

export default function LoginPage() {
  return (
    <div
      className={[
        "min-h-screen flex items-center justify-center",
        "bg-[#fdfcf8]",
      ].join(" ")}
      style={{
        backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* 柔和的散景光晕装饰，避免极客感和商务风 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={[
            "absolute -top-40 -right-20 h-[32rem] w-[32rem] rounded-full",
            "bg-orange-100/40 mix-blend-multiply blur-[80px]",
          ].join(" ")}
        />
        <div
          className={[
            "absolute -bottom-40 -left-20 h-[32rem] w-[32rem] rounded-full",
            "bg-emerald-100/30 mix-blend-multiply blur-[80px]",
          ].join(" ")}
        />
        <div
          className={[
            "absolute top-1/3 left-1/4 h-[24rem] w-[24rem] rounded-full",
            "bg-yellow-50/50 mix-blend-multiply blur-[60px]",
          ].join(" ")}
        />
      </div>

      <div className="relative">
        <LoginCard />
      </div>
    </div>
  );
}
