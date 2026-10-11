import { useCallback, useState } from "react";
import type { JSX } from "react";
import { Archive, Eraser, MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import clsx from "clsx";
type Props = {
  hasChapter: boolean;
  canDeleteChapterPages: boolean;
  canArchiveComic: boolean;
  isTeamAdmin: boolean;
  isDeletingChapterPages: boolean;
  isArchivingComic: boolean;
  isDeletingComic: boolean;
  onDeletePages: () => void;
  onArchiveComic: () => void;
  onDeleteComic: () => void;
};
export function ComicDetailMoreActions({
  hasChapter,
  canDeleteChapterPages,
  canArchiveComic,
  isTeamAdmin,
  isDeletingChapterPages,
  isArchivingComic,
  isDeletingComic,
  onDeletePages,
  onArchiveComic,
  onDeleteComic,
}: Props): JSX.Element {
  const [menuBoundary, setMenuBoundary] = useState<Element | null>(null);
  const [menuSide, setMenuSide] = useState<"right" | "bottom">("right");
  const moreTriggerRef = useCallback((node: HTMLButtonElement | null) => {
    if (!node) {
      return;
    }
    const trigger = node;
    const boundary = node.closest("[data-comic-detail-boundary]");
    setMenuBoundary(boundary);
    function updateSide(): void {
      const available =
        (boundary?.getBoundingClientRect().right ?? window.innerWidth) -
        trigger.getBoundingClientRect().right;
      setMenuSide(available >= 156 ? "right" : "bottom");
    }
    updateSide();
    const observer = new ResizeObserver(updateSide);
    observer.observe(node);
    if (boundary) {
      observer.observe(boundary);
    }
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {" "}
      {(canDeleteChapterPages || canArchiveComic || isTeamAdmin) && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              ref={moreTriggerRef}
              type="button"
              className={clsx(
                "flex h-7 w-full items-center justify-center gap-1.5 rounded-sm",
                "text-[10px] font-semibold text-text-muted-warm hover:text-ink-stone-700",
              )}
            >
              <MoreHorizontal size={13} />
              更多操作
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side={menuSide}
              align="center"
              sideOffset={menuSide === "right" ? 20 : 8}
              collisionBoundary={menuBoundary}
              collisionPadding={8}
              sticky="always"
              className={clsx(
                "z-100 min-w-32 rounded-md border border-line-stone-200 bg-surface-stone-50 p-1",
                "text-xs text-ink-stone-600 shadow-md overflow-y-auto",
                "max-h-(--radix-dropdown-menu-content-available-height)",
                "max-w-(--radix-dropdown-menu-content-available-width)",
              )}
            >
              {[
                {
                  visible: canDeleteChapterPages && hasChapter,
                  label: "清空页面",
                  icon: Eraser,
                  action: onDeletePages,
                  disabled: isDeletingChapterPages,
                },
                {
                  visible: canArchiveComic,
                  label: "归档漫画",
                  icon: Archive,
                  action: onArchiveComic,
                  disabled: isArchivingComic,
                },
                {
                  visible: isTeamAdmin,
                  label: "删除漫画",
                  icon: Trash2,
                  action: onDeleteComic,
                  disabled: isDeletingComic,
                },
              ]
                .filter((item) => item.visible)
                .map((item) => (
                  <DropdownMenu.Item
                    key={item.label}
                    onSelect={item.action}
                    disabled={item.disabled}
                    className={clsx(
                      "flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 outline-none",
                      "data-highlighted:bg-surface-stone-200 data-disabled:opacity-40",
                      item.label === "删除漫画" && "text-text-danger",
                    )}
                  >
                    <item.icon size={13} />
                    {item.label}
                  </DropdownMenu.Item>
                ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </>
  );
}
