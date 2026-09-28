import { useState, type ReactElement } from "react";
import { Key, Lock, User, UserRoundPen } from "lucide-react";
import clsx from "clsx";
import { IconInputRow } from "@/shared/component/IconInputRow";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { beginSession } from "@/route/business/session/session";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useApiClient } from "@/route/business/api-context";
import { loginApi, registerApi } from "@/api/identity/identity-api";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import { writeFirstRegistrationFlag } from "@/route/business/onboarding/storage";

type Mode = "login" | "register";

export function LoginCard(): ReactElement {
  const [mode, setMode] = useState<Mode>("login");
  const [qq, setQq] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { showToast } = useToastStore();
  const client = useApiClient();
  const navigate = useNavigate();
  const router = useRouter();

  const switchMode = (next: Mode): void => {
    setMode(next);
    if (next === "login") {
      setName("");
      setInvitationCode("");
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!qq) {
      showToast("QQ 号不能为空", "error");
      return;
    }
    if (!password) {
      showToast("密码不能为空", "error");
      return;
    }
    if (mode === "register") {
      if (!name) {
        showToast("昵称不能为空", "error");
        return;
      }
      if (!invitationCode) {
        showToast("邀请码不能为空", "error");
        return;
      }
    }

    setIsLoading(true);
    try {
      const result =
        mode === "login"
          ? await loginApi(client, { qid: qq, password })
          : await registerApi(client, {
              qid: qq,
              password,
              nickname: name,
              code: invitationCode,
            });

      if (!result.success) {
        showLocalApiFailure(result, showToast);
        console.error("[LoginCard] 操作失败：", result.error);
        return;
      }

      beginSession(result.data.token);
      await router.invalidate();
      if (mode === "register") {
        writeFirstRegistrationFlag(false);
      }
      showToast(mode === "login" ? "登录成功！" : "注册成功！", "success");
      await navigate({ to: "/comic-playground", search: {}, replace: true });
    } catch (error) {
      showLocalCaughtError(error, showToast, "操作失败，请稍后重试");
      console.error("[LoginCard] 操作异常：", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={clsx(
        "w-full max-w-sm overflow-hidden rounded-xl",
        "border border-border",
        "bg-surface-panel shadow-(--shadow-sm)",
      )}
    >
      {/* 顶部品牌色条 */}
      <div className="h-1 w-full bg-primary" />

      {/* 品牌标识区 */}
      <div className="flex items-end justify-between px-6 pt-5 pb-3">
        <div>
          <h1 className="mt-0.5 text-xl font-bold leading-none text-foreground">PopRaKo W</h1>
        </div>
        {/* 装饰小方块，呼应漫画格子感 */}
        <div className="mb-0.5 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={clsx(
                "h-2.5 w-2.5 rounded-[3px]",
                i === 0 ? "bg-primary" : i === 1 ? "bg-primary-muted" : "bg-primary-subtle",
              )}
            />
          ))}
        </div>
      </div>

      {/* 模式切换 Tab */}
      <div className={clsx("mx-6 mb-4 flex rounded-lg p-0.5", "bg-primary-subtle")}>
        {(["login", "register"] as Mode[]).map((m) => (
          <button
            type="button"
            key={m}
            onClick={() => {
              switchMode(m);
            }}
            className={clsx(
              "flex-1 rounded-md py-1.5 text-xs font-semibold",
              "transition-all duration-200 focus:outline-none",
              mode === m
                ? "bg-surface-panel text-foreground shadow-(--shadow-sm)"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "login" ? "登录" : "注册"}
          </button>
        ))}
      </div>

      <div className="px-6 pb-6">
        {/* 输入区域 */}
        <div className="flex flex-col gap-2.5">
          <IconInputRow
            icon={<User size={14} />}
            placeholder="QQ 号"
            value={qq}
            onChange={setQq}
            mode="numeric"
          />
          <IconInputRow
            icon={<Lock size={14} />}
            placeholder="密码"
            mode="password"
            value={password}
            onChange={setPassword}
          />

          {/* 注册专属字段 — 伸缩动画 */}
          <div
            aria-hidden={mode !== "register"}
            className={clsx(
              "flex flex-col gap-2.5 overflow-hidden",
              "transition-all duration-300 ease-in-out",
              mode === "register"
                ? "max-h-28 opacity-100"
                : "pointer-events-none max-h-0 opacity-0",
            )}
          >
            <IconInputRow
              icon={<UserRoundPen size={14} />}
              placeholder="昵称"
              value={name}
              onChange={setName}
            />
            <IconInputRow
              icon={<Key size={14} />}
              placeholder="邀请码"
              value={invitationCode}
              onChange={setInvitationCode}
            />
          </div>
        </div>

        {/* 提交按钮 — 浅绿底 + 项目主色文字 */}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            void handleSubmit();
          }}
          className={clsx(
            "mt-4 w-full rounded-lg py-2 text-sm font-semibold",
            "bg-primary-subtle text-primary-text",
            "border border-primary-border",
            "transition-all duration-200 active:scale-[0.98]",
            "hover:bg-primary-muted",
            "focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {isLoading ? "处理中…" : mode === "login" ? "登录" : "注册"}
        </button>
      </div>
    </div>
  );
}
