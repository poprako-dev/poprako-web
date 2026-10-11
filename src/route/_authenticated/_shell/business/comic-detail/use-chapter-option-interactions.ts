import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";

type PointerArgs = {
  onLongPress?: ((chapter: ChapterInfo) => void) | undefined;
  onSelect: (chapterId: string) => void;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

interface ChapterPointerHandlers {
  handleChapterPointerDown: (chapter: ChapterInfo) => (event: React.PointerEvent) => void;
  handleChapterPointerUp: () => (event: React.PointerEvent) => void;
  handleChapterPointerCancel: () => () => void;
  handleChapterContextMenu: () => (event: React.MouseEvent) => void;
}

type LongPressState = {
  timerRef: RefObject<ReturnType<typeof setTimeout> | null>;
  chapterRef: RefObject<ChapterInfo | null>;
  handledRef: RefObject<boolean>;
  clear: () => void;
};

function clearLongPressTimer(timerRef: RefObject<ReturnType<typeof setTimeout> | null>): void {
  if (!timerRef.current) return;
  clearTimeout(timerRef.current);
  timerRef.current = null;
}

export function useChapterPointerHandlers({
  onLongPress,
  onSelect,
  setIsOpen,
}: PointerArgs): ChapterPointerHandlers {
  const { timerRef, chapterRef, handledRef, clear: clearLongPress } = useLongPressState();
  const handleChapterPointerDown = useCallback(
    (chapter: ChapterInfo) => (event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      handledRef.current = false;
      chapterRef.current = chapter;
      timerRef.current = setTimeout(() => {
        handledRef.current = true;
        onLongPress?.(chapter);
      }, 500);
    },
    [chapterRef, handledRef, onLongPress, timerRef],
  );
  const handleChapterPointerUp = useCallback(
    () => (event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      clearLongPress();
      if (!handledRef.current && chapterRef.current) {
        onSelect(chapterRef.current.id);
        setIsOpen(false);
      }
    },
    [chapterRef, clearLongPress, handledRef, onSelect, setIsOpen],
  );
  const handleChapterPointerCancel = useCallback(() => {
    return clearLongPress;
  }, [clearLongPress]);
  const handleChapterContextMenu = useChapterContextMenuHandler();

  useEffect(() => {
    return () => {
      clearLongPress();
    };
  }, [clearLongPress]);

  return {
    handleChapterPointerDown,
    handleChapterPointerUp,
    handleChapterPointerCancel,
    handleChapterContextMenu,
  };
}

function useLongPressState(): LongPressState {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chapterRef = useRef<ChapterInfo | null>(null);
  const handledRef = useRef(false);
  const clear = useCallback((): void => {
    clearLongPressTimer(timerRef);
  }, []);
  return { timerRef, chapterRef, handledRef, clear };
}

function useChapterContextMenuHandler(): ChapterPointerHandlers["handleChapterContextMenu"] {
  return useCallback(
    () => (event: React.MouseEvent) => {
      event.preventDefault();
    },
    [],
  );
}

type DropdownEffectArgs = {
  isOpen: boolean;
  hasMore: boolean;
  isLoading: boolean | undefined;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  observerRef: React.RefObject<HTMLDivElement | null>;
  onLoadMore: () => void;
};

export function useChapterDropdownEffects({
  isOpen,
  hasMore,
  isLoading,
  setIsOpen,
  dropdownRef,
  observerRef,
  onLoadMore,
}: DropdownEffectArgs): void {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, isOpen, setIsOpen]);

  useEffect(() => {
    if (!isOpen || !hasMore || isLoading || !observerRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        onLoadMore();
      }
    });
    observer.observe(observerRef.current);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, isOpen, observerRef, onLoadMore]);
}
