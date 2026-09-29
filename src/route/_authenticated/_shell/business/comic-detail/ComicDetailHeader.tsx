import type { JSX } from "react";
import clsx from "clsx";
import { X } from "lucide-react";
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
  onClose: () => void;
};

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
  onClose,
}: Props): JSX.Element {
  const titleLongPress = useLongPress({
    onLongPress:
      onLongPressTitle ??
      (() => {
        return;
      }),
    threshold: 500,
  });

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
            "px-2 py-0.5 rounded-xs text-md opacity-80 font-black text-ink-white",
            "leading-none shrink-0",
          )}
          style={{ backgroundColor: "var(--brand-leaf)" }}
        >
          #{comicInfo.index + 1}
        </div>
        <h1
          {...titleLongPress}
          className={clsx(
            "text-lg font-black tracking-tight text-ink-stone-700 min-w-0 flex-1",
            onLongPressTitle && "select-none touch-none",
          )}
          title={onLongPressTitle ? "长按修改作品信息" : undefined}
        >
          {comicInfo.title}
        </h1>
        <div className="hidden sm:block shrink-0">{chapterOption}</div>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭漫画详情"
          className="text-ink-stone-400 hover:text-ink-stone-700 transition-colors p-1 shrink-0"
        >
          <X size={18} />
        </button>
      </div>
      <div className="sm:hidden">{chapterOption}</div>
    </div>
  );
}
