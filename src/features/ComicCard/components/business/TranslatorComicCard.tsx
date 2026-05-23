import type React from "react";
import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  FileText,
  Languages,
  CheckSquare,
  Clock,
  Tag,
  Hash,
} from "lucide-react";
import type { ChapterInfo, ComicInfo } from "@/types";
import MultiProgressBar from "@/components/ui/MultiProgressBar";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import type { Result } from "@/types/utils/result";

type Props = {
  comicInfo: ComicInfo;
  // 返回当前漫画的顶置章节信息，如果没有则返回 null
  // 如果发生错误则返回错误信息字符串
  onLoadPinnedChapter: (
    comicInfo: ComicInfo,
  ) => Promise<Result<ChapterInfo | null>>;
};

function getActivityStatusColor(lastActiveAt: number | undefined): string {
  if (!lastActiveAt) return "bg-stone-300";
  const diff = Date.now() - lastActiveAt;
  const threeMonths = 1000 * 60 * 60 * 24 * 90;
  const sixMonths = 1000 * 60 * 60 * 24 * 180;
  if (diff <= threeMonths) return "bg-[#2e5c33]";
  if (diff <= sixMonths) return "bg-amber-200";
  return "bg-stone-300";
}

function formatDate(ts: number | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function DataTag({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <div
      className={clsx(
        "flex flex-1 items-center justify-center gap-1 py-0.5",
        "text-[11px] font-semibold text-stone-500",
      )}
    >
      <span className="text-stone-400 flex items-center justify-center">
        {icon}
      </span>
      <span className="leading-none">{value}</span>
    </div>
  );
}

// 翻译·校对版漫画卡片
// 无状态受控组件，纯展示用
// 以漫画为入口，自动加载最新章节信息
// 展示翻译进度、校对进度等统计数据
export default function TranslatorComicCard({
  comicInfo,
  onLoadPinnedChapter: onLoadLatestChapter,
}: Props) {
  const { showToast } = useToastStore();
  const [chapter, setChapter] = useState<ChapterInfo | null>(null);

  useEffect(() => {
    let active = true;
    onLoadLatestChapter(comicInfo)
      .then((res) => {
        if (!active) return;
        if (!res.success) {
          console.error("[TranslatorComicCard] 加载最新章节失败:", res);
          showToast("加载章节失败", "error");
          return;
        }
        setChapter(res.data);
      })
      .catch((err) => {
        if (!active) return;
        console.error("[TranslatorComicCard] 加载最新章节异常:", err);
        showToast("加载章节失败", "error");
      });
    return () => {
      active = false;
    };
  }, [comicInfo.id]);

  const total = chapter?.totalUnitCount ?? 0;
  const translated = chapter?.translatedUnitCount ?? 0;
  const proofread = chapter?.proofreadUnitCount ?? 0;

  const translationPct = total > 0 ? Math.floor((translated / total) * 100) : 0;
  const proofreadPct = total > 0 ? Math.floor((proofread / total) * 100) : 0;
  const pageCount = chapter?.pageCount ?? 0;

  return (
    <div className="flex w-full h-full px-2 pt-1 pb-1.5">
      {/* 左侧封面 */}
      <div className="w-16 h-full shrink-0 overflow-hidden bg-stone-100">
        {comicInfo.coverUrl ? (
          <img
            src={comicInfo.coverUrl}
            alt={comicInfo.title}
            className="w-full h-full rounded-sm object-cover grayscale-[0.3]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText size={20} className="text-stone-300" />
          </div>
        )}
      </div>

      {/* 右侧数据 */}
      <div className="flex-1 flex flex-col justify-between min-w-0 px-2 py-1">
        {/* 第一行：标题 + 状态指示线 */}
        <div className="flex items-center justify-between gap-1.5">
          <h3
            className={clsx(
              "text-base font-bold text-stone-700",
              "truncate leading-tight",
            )}
          >
            {comicInfo.title || "未命名"}
          </h3>
          <div
            className={clsx(
              "h-3 w-1 rounded-full shrink-0",
              getActivityStatusColor(comicInfo.lastActiveAt),
            )}
          />
        </div>

        {/* 第二行：序号 + 日期 + 页数 */}
        <div className="flex items-center gap-1 text-[11px] text-stone-400/80 font-mono">
          <Hash size={11} strokeWidth={2.5} />
          <span>{comicInfo.index + 1}</span>
          <span className="text-stone-200">|</span>
          <div className="flex items-center gap-1 shrink-0">
            <Clock size={11} strokeWidth={2.5} />
            <span className="tracking-tighter">
              {formatDate(comicInfo.lastActiveAt)}
            </span>
          </div>
          <span className="text-stone-200">|</span>
          <div className="flex items-center gap-1 shrink-0">
            <FileText size={11} strokeWidth={2.5} />
            <span>{pageCount}P</span>
          </div>
        </div>

        {/* 第三行：统计标签 — 内陷式槽 */}
        <div className="flex rounded-[3px] bg-stone-200/30 p-0.5">
          <DataTag icon={<Tag size={12} strokeWidth={2.5} />} value={total} />
          <DataTag
            icon={<Languages size={12} strokeWidth={2.5} />}
            value={translated}
          />
          <DataTag
            icon={<CheckSquare size={12} strokeWidth={2.5} />}
            value={proofread}
          />
        </div>

        {/* 第四行：进度条 */}
        <MultiProgressBar
          fullWidth
          height={0.5}
          bars={[
            {
              progressPercent: translationPct,
              barColorClass: "bg-stone-400",
            },
            {
              progressPercent: proofreadPct,
              barColorClass: "bg-amber-200",
            },
          ]}
        />
      </div>
    </div>
  );
}
