import type { JSX } from "react";
import clsx from "clsx";
import { Copy, X } from "lucide-react";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { MemberInfo } from "@/route/business/identity/member";
import type { Result } from "@/shared/utility/result";
import { useLongPress } from "@/shared/hook/use-long-press";
import { ChapterOption } from "@/route/_authenticated/_shell/business/comic-detail/ChapterOption";
import type { DetailContract } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";

type Props = {
  comicInfo: ComicInfo;
  activeMember: MemberInfo | null;
  chapters: ChapterInfo[];
  selectedChapter?: ChapterInfo | undefined;
  selectedChapterId: string | null;
  hasMore: boolean;
  isLoading: boolean;
  canCreateChapter: boolean;
  onLoadMore: () => void;
  onSelect: (chapterId: string | null) => void;
  onCreateChapter?: DetailContract["onCreateChapter"] | undefined;
  onCreate: (
    subtitle: string | undefined,
    presetAssignmentRoles: number | undefined,
  ) => Promise<Result<string>>;
  onDeleteChapter?: DetailContract["onDeleteChapter"] | undefined;
  onDelete: (chapterId: string) => Promise<void>;
  onLongPressTitle?: (() => void) | undefined;
  onLongPressChapter?: ((chapter: ChapterInfo) => void) | undefined;
  onCopyTitle: () => void;
  onClose: () => void;
};

function useComicTitleLongPress(
  onLongPressTitle: Props["onLongPressTitle"],
): ReturnType<typeof useLongPress> {
  return useLongPress({
    onLongPress:
      onLongPressTitle ??
      (() => {
        return;
      }),
    threshold: 500,
  });
}

export function ComicDetailHeader({
  comicInfo,
  activeMember,
  chapters,
  selectedChapter,
  selectedChapterId: _selectedChapterId,
  hasMore,
  isLoading,
  canCreateChapter,
  onLoadMore,
  onSelect,
  onCreateChapter,
  onCreate,
  onDeleteChapter,
  onDelete,
  onLongPressTitle,
  onLongPressChapter,
  onCopyTitle,
  onClose,
}: Props): JSX.Element {
  const titleLongPress = useComicTitleLongPress(onLongPressTitle);

  const chapterOption = (
    <ChapterOption
      comicInfo={comicInfo}
      activeMember={activeMember}
      chapters={chapters}
      selectedChapter={selectedChapter}
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={onLoadMore}
      onSelect={onSelect}
      onCreateChapter={
        onCreateChapter && canCreateChapter
          ? async (subtitle, presetAssignmentRoles) => onCreate(subtitle, presetAssignmentRoles)
          : undefined
      }
      onDelete={
        onDeleteChapter
          ? (id) => {
              void onDelete(id);
            }
          : undefined
      }
      onLongPress={onLongPressChapter}
    />
  );

  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={clsx(
            "px-2 py-0.5 rounded-xs text-md font-black text-heading-forest bg-brand-leaf/80",
            "leading-none shrink-0",
          )}
        >
          #{comicInfo.index + 1}
        </div>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h1
            {...titleLongPress}
            className={clsx(
              "text-lg font-black tracking-tight text-ink-stone-700 min-w-0",
              onLongPressTitle && "select-none touch-none",
            )}
            title={onLongPressTitle ? "长按修改作品信息" : undefined}
          >
            {comicInfo.title}
          </h1>
          <button
            type="button"
            onClick={onCopyTitle}
            aria-label="复制格式化标题"
            title="复制格式化标题"
            className={clsx(
              "text-text-muted-warm hover:text-ink-stone-700 transition-colors p-1 shrink-0 rounded-xs",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-stone-700",
            )}
          >
            <Copy size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="hidden sm:block shrink-0">{chapterOption}</div>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭漫画详情"
          className="text-text-muted-warm hover:text-ink-stone-700 transition-colors p-1 shrink-0"
        >
          <X size={18} />
        </button>
      </div>
      <div className="sm:hidden">{chapterOption}</div>
    </div>
  );
}
