import { ArrowUpRight, CircleUserRound, GraduationCap, KeyRound } from "lucide-react";
import type { ReactElement } from "react";
import clsx from "clsx";
import { AppDialog, AppDialogAction } from "@/shared/component/AppDialog";

type Props = {
  onClose: () => void;
  onOpenSettings: () => void;
};

const guideItems = [
  {
    icon: CircleUserRound,
    title: "上传一张头像",
    description: "让团队成员更容易认出你",
  },
  {
    icon: KeyRound,
    title: "修改初始密码",
    description: "换成只有你知道的新密码",
  },
];

export function FirstRegistrationGuideDialog({ onClose, onOpenSettings }: Props): ReactElement {
  return (
    <AppDialog
      title="欢迎来到白杨子 W"
      description="开始协作前，花一分钟完善你的账号"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <AppDialogAction onClick={onClose}>稍后再说</AppDialogAction>
          <AppDialogAction tone="brand" onClick={onOpenSettings}>
            前往设置
          </AppDialogAction>
        </div>
      }
    >
      <div className="border-y border-border">
        {guideItems.map((item, index) => (
          <div
            key={item.title}
            className={clsx("flex items-center gap-3 py-3", index > 0 && "border-t border-border")}
          >
            <span
              className={clsx(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                "bg-status-success/10 text-status-success",
              )}
            >
              <item.icon size={17} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">{item.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{item.description}</span>
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <GraduationCap className="mt-0.5 size-4 shrink-0 text-status-warning" />
        <span>
          想先熟悉流程？可以在
          <a
            href="https://tutorial.poprako.com"
            target="_blank"
            rel="noreferrer"
            className={clsx(
              "mx-1 inline-flex items-center gap-0.5 font-semibold text-status-success",
              "underline decoration-green-200 underline-offset-2 hover:text-status-success",
            )}
          >
            白杨子 T 网站
            <ArrowUpRight size={12} />
          </a>
          体验完整教程。
        </span>
      </p>
    </AppDialog>
  );
}
