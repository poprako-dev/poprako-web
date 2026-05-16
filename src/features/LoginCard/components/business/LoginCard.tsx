import { useState } from "react";
import { Key, Lock, User, UserRoundPen } from "lucide-react";
import clsx from "clsx";
import IconInputRow from "@/components/ui/IconInputRow";
import { useToastStore } from "@/components/ui/NotificationToast";
import { useAppStore } from "@/store/app";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../../api/auth";

type Mode = "login" | "register";

export default function LoginCard() {
  const [mode, setMode] = useState<Mode>("login");
  const [qq, setQq] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { showToast } = useToastStore();
  const setAccessToken = useAppStore((s) => s.setAccessToken);
  const setLoginState = useAppStore((s) => s.setLoginState);
  const navigate = useNavigate();

  const switchMode = (next: Mode) => {
    setMode(next);
    if (next === "login") {
      setName("");
      setInvitationCode("");
    }
  };

  const handleSubmit = async () => {
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
          ? await loginUser({ qq, password })
          : await registerUser({ qq, password, name, invitationCode });

      if (!result.success) {
        showToast(result.error, "error");
        console.error("[LoginCard] 操作失败：", result.error);
        return;
      }

      setAccessToken(result.data.accessToken);
      setLoginState(null);
      showToast(mode === "login" ? "登录成功！" : "注册成功！", "success");
      navigate("/comic-playground", { replace: true });
    } catch (err) {
      showToast("操作失败，请稍后重试", "error");
      console.error("[LoginCard] 操作异常：", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={clsx(
        "w-full max-w-sm overflow-hidden rounded-xl",
        "border border-(--color-border-green-200)",
        "bg-white shadow-(--shadow-sm)",
      )}
    >
      {/* 顶部品牌色条 */}
      <div
        className="h-1 w-full"
        style={{ background: "var(--color-green-500)" }}
      />

      {/* 品牌标识区 */}
      <div className="flex items-end justify-between px-6 pt-5 pb-3">
        <div>
          <h1 className="mt-0.5 text-xl font-bold leading-none text-slate-800">
            PopRaKo W
          </h1>
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
                    ? "var(--color-green-500)"
                    : i === 1
                      ? "var(--color-green-100)"
                      : "var(--color-green-50)",
              }}
            />
          ))}
        </div>
      </div>

      {/* 模式切换 Tab */}
      <div className={clsx("mx-6 mb-4 flex rounded-lg p-0.5", "bg-green-50")}>
        {(["login", "register"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={clsx(
              "flex-1 rounded-md py-1.5 text-xs font-semibold",
              "transition-all duration-200 focus:outline-none",
              mode === m
                ? "bg-white text-slate-800 shadow-(--shadow-sm)"
                : "text-slate-400 hover:text-slate-600",
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
            numeric
          />
          <IconInputRow
            icon={<Lock size={14} />}
            placeholder="密码"
            password
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
          disabled={isLoading}
          onClick={handleSubmit}
          className={clsx(
            "mt-4 w-full rounded-lg py-2 text-sm font-semibold",
            "bg-green-50 text-green-500",
            "border border-(--color-border-green-200)",
            "transition-all duration-200 active:scale-[0.98]",
            "hover:bg-green-100",
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
