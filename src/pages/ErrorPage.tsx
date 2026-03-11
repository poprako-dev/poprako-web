import clsx from "clsx";
import { TreePine } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type Props = {
  /** 错误状态码，例如 404, 500 */
  code?: string | number;
  /** 错误标题 */
  title?: string;
  /** 详细描述信息 */
  message?: string;
};

export default function ErrorPage({
  code = "404",
  title = "页面未找到",
  message = "抱歉，似乎白杨子还没有支持这个页面哦 TvT",
}: Props) {
  const navigate = useNavigate();

  const onGoHome = () => {
    navigate("/");
  };

  const styles = {
    // 整体容器：视口高度，居中，纯白背景
    container: clsx(
      "min-h-screen w-full",
      "flex flex-col items-center justify-center",
      "bg-white",
      "px-4 sm:px-6 lg:px-8",
      "selection:bg-emerald-100 selection:text-emerald-700", // 选中态也保持自然色
    ),

    // 图标区域：淡绿色背景圆环，呼吸感
    iconWrapper: clsx(
      "mb-8",
      "flex h-24 w-24 items-center justify-center",
      "rounded-full",
      "bg-emerald-50", // 极淡的绿色背景
      "animate-pulse", // 轻微的呼吸动画，增加生命力
    ),

    // 图标本身：自然绿
    icon: clsx("h-10 w-10", "text-emerald-500"),

    // 状态码：极简，淡色，不抢眼
    codeText: clsx(
      "mb-2",
      "text-sm font-medium tracking-widest uppercase",
      "text-emerald-600/80",
    ),

    // 标题：深灰色，字体轻盈
    heading: clsx(
      "mb-4",
      "text-3xl font-light tracking-tight",
      "text-slate-800",
      "sm:text-4xl",
    ),

    // 描述文字：柔和灰，限制宽度以保证阅读体验
    paragraph: clsx(
      "mb-10 max-w-md text-center",
      "text-base leading-relaxed",
      "text-slate-500",
    ),

    // 按钮组容器
    buttonGroup: clsx("flex flex-col gap-4", "sm:flex-row sm:gap-6"),

    // 主要按钮：淡绿色，无阴影，圆角柔和
    primaryButton: clsx(
      "inline-flex items-center justify-center",
      "rounded-full",
      "border-2 border-emerald-300/50 px-8 py-3",
      "text-sm font-medium text-emerald-400",
      "transition-colors duration-200",
      "hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
    ),

    // 次要按钮（重试）：透明背景，简单的文字链接感
    secondaryButton: clsx(
      "inline-flex items-center justify-center",
      "rounded-full",
      "bg-white px-8 py-3",
      "text-sm font-medium text-slate-500",
      "border border-slate-200",
      "transition-colors duration-200",
      "hover:bg-slate-50 hover:text-slate-700",
    ),
  };

  return (
    <div className={styles.container}>
      {/* 装饰性自然图标 (叶子/发芽) */}
      <div className={styles.iconWrapper}>
        <TreePine className={styles.icon} />
      </div>

      {/* 状态码 */}
      <p className={styles.codeText}>{code}</p>

      {/* 标题 */}
      <h1 className={styles.heading}>{title}</h1>

      {/* 描述信息 */}
      <p className={styles.paragraph}>{message}</p>

      {/* 按钮区域 */}
      <div className={styles.buttonGroup}>
        {onGoHome && (
          <button onClick={onGoHome} className={styles.primaryButton}>
            返回首页
          </button>
        )}
      </div>
    </div>
  );
}
