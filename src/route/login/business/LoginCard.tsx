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
import type { ApiClient } from "@/api/client";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";

type Mode = "login" | "register";

type SubmitOptions = {
  mode: Mode;
  qq: string;
  password: string;
  name: string;
  invitationCode: string;
  setIsLoading: (loading: boolean) => void;
  showToast: (message: string, type: ToastType) => void;
  client: ApiClient;
  router: ReturnType<typeof useRouter>;
  navigate: ReturnType<typeof useNavigate>;
};

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

  const handleSubmit = (): Promise<void> =>
    submitLogin({
      mode,
      qq,
      password,
      name,
      invitationCode,
      setIsLoading,
      showToast,
      client,
      router,
      navigate,
    });

  return (
    <div
      className={clsx(
        "w-full max-w-sm overflow-hidden rounded-xl",
        "border border-(--brand-leaf-border)",
        "bg-surface-white shadow-(--shadow-sm)",
      )}
    >
      {/* 顶部品牌色条 */}
      <div className="h-1 w-full" style={{ background: "var(--brand-leaf)" }} />

      {/* 品牌标识区 */}
      <div className="flex items-end justify-between px-6 pt-5 pb-3">
        <div>
          <h1 className="mt-0.5 text-xl font-bold leading-none text-ink-slate-800">PopRaKo W</h1>
        </div>
        {/* 装饰小方块，呼应漫画格子感 */}
        <div className="mb-0.5 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{
                background:
                  i === 0
                    ? "var(--brand-leaf)"
                    : i === 1
                      ? "var(--brand-leaf-muted)"
                      : "var(--brand-leaf-faint)",
              }}
            />
          ))}
        </div>
      </div>

      {/* 模式切换 Tab */}
      <div className={clsx("mx-6 mb-4 flex rounded-lg p-0.5", "bg-surface-green-50")}>
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
                ? "bg-surface-white text-ink-slate-800 shadow-(--shadow-sm)"
                : "text-text-muted-cool hover:text-ink-slate-600",
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
            inert={mode !== "register"}
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
            "bg-surface-green-50 text-ink-green-500",
            "border border-(--brand-leaf-border)",
            "transition-all duration-200 active:scale-[0.98]",
            "hover:bg-surface-green-100",
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

async function submitLogin(options: SubmitOptions): Promise<void> {
  if (!validateLogin(options)) return;
  options.setIsLoading(true);
  try {
    await performLogin(options);
  } catch (error) {
    showLocalCaughtError(error, options.showToast, "操作失败，请稍后重试");
    console.error("[LoginCard] 操作异常：", error);
  } finally {
    options.setIsLoading(false);
  }
}

function validateLogin(options: SubmitOptions): boolean {
  const required = [
    [options.qq, "QQ 号不能为空"],
    [options.password, "密码不能为空"],
    ...(options.mode === "register"
      ? [
          [options.name, "昵称不能为空"],
          [options.invitationCode, "邀请码不能为空"],
        ]
      : []),
  ];
  const missing = required.find(([value]) => !value);
  if (!missing) return true;
  options.showToast(missing[1] ?? "", "error");
  return false;
}

async function performLogin(options: SubmitOptions): Promise<void> {
  const result = await requestLogin(options);
  if (!result.success) {
    showLocalApiFailure(result, options.showToast);
    console.error("[LoginCard] 操作失败：", result.error);
    return;
  }
  beginSession(result.data.token);
  await options.router.invalidate();
  finishLogin(options);
  await options.navigate({ to: "/comic-playground", search: {}, replace: true });
}

function requestLogin(options: SubmitOptions): ReturnType<typeof loginApi> {
  return options.mode === "login"
    ? loginApi(options.client, { qid: options.qq, password: options.password })
    : registerApi(options.client, {
        qid: options.qq,
        password: options.password,
        nickname: options.name,
        code: options.invitationCode,
      });
}

function finishLogin(options: SubmitOptions): void {
  if (options.mode === "register") writeFirstRegistrationFlag(false);
  options.showToast(options.mode === "login" ? "登录成功！" : "注册成功！", "success");
}
