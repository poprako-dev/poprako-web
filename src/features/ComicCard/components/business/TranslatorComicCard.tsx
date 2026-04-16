import type React from "react";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { FileText, CircleCheck, CheckCheck, Clock, Tag } from "lucide-react";
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

function formatDate(ts: number | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function DataTag({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <div className="flex items-center text-slate-500 bg-gray-100/80 px-1.5 py-1 rounded-sm min-w-0">
      <span className="text-slate-400 ml-1 w-5 shrink-0 flex items-center justify-center">
        {icon}
      </span>
      <span className="text-sm font-medium leading-none flex-1 text-center min-w-0">
        {value}
      </span>
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
    <div className="flex flex-col w-full h-full">
      {/* Header：标题 + 话号 */}
      <div className="px-3 py-2 shrink-0 bg-slate-50">
        <div className="flex items-center gap-3">
          <h3
            className={clsx(
              "text-base font-bold text-slate-700",
              "truncate flex-1 leading-none",
            )}
          >
            {comicInfo.title || "未命名"}
          </h3>
          <span
            className={clsx(
              "text-xs font-mono text-slate-400",
              "bg-slate-100 px-1.5 py-0.5 rounded shrink-0",
            )}
          >
            #{comicInfo.index + 1}
          </span>
        </div>
      </div>

      {/* 主体区域：左封面 + 右侧三行统计 */}
      <div className="flex flex-1 px-3 pb-2 pt-1 gap-2 items-stretch min-h-0">
        <div className="w-16 h-full shrink-0 rounded overflow-hidden bg-slate-100" />

        <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <div className="flex items-center gap-1 shrink-0">
              <Clock size={14} strokeWidth={2.5} />
              <span className="font-medium">
                {formatDate(comicInfo.lastActiveAt)}
              </span>
            </div>
            <span className="text-slate-300">·</span>
            <div className="flex items-center gap-1 shrink-0">
              <FileText size={14} strokeWidth={2.5} />
              <span className="font-medium">{pageCount}P</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <DataTag icon={<Tag size={18} strokeWidth={2.5} />} value={total} />
            <DataTag
              icon={<CircleCheck size={18} strokeWidth={2.5} />}
              value={translated}
            />
            <DataTag
              icon={<CheckCheck size={18} strokeWidth={2.5} />}
              value={proofread}
            />
          </div>

          <div className="pt-1">
            <MultiProgressBar
              fullWidth
              height={0.5}
              bars={[
                {
                  progressPercent: translationPct,
                  barColorClass: "bg-orange-200",
                },
                {
                  progressPercent: proofreadPct,
                  barColorClass: "bg-pink-200",
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
