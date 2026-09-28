import { useEffect, useState } from "react";

export type CharItem = {
  id: string;
  text: string;
  isFavorite: boolean;
};

const STORAGE_KEY = "specialChars_v2";
const CHANGE_EVENT = "specialChars:change";

const DEFAULT_CHARS: CharItem[] = [
  { id: "1", text: "♪", isFavorite: true },
  { id: "2", text: "「」", isFavorite: true },
  { id: "3", text: "『』", isFavorite: true },
  { id: "4", text: "❤", isFavorite: true },
  { id: "5", text: "●", isFavorite: true },
  { id: "6", text: "★", isFavorite: true },
  { id: "7", text: "☆", isFavorite: true },
  { id: "8", text: "♡", isFavorite: true },
  { id: "9", text: "○", isFavorite: true },
  { id: "10", text: "※", isFavorite: true },
];

function loadFromStorage(): CharItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CharItem[];
  } catch {
    // ignore parse error, fall through to defaults
  }
  return DEFAULT_CHARS;
}

function saveToStorage(chars: CharItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chars));
  setTimeout(() => {
    dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: chars }));
  }, 0);
}

export function useSpecialChars(): {
  allChars: CharItem[];
  favoriteChars: string[];
  addChar: (text: string) => void;
  deleteChar: (id: string) => void;
  toggleFavorite: (id: string) => void;
  reorderChars: (activeId: string, overId: string) => void;
} {
  const [allChars, setAllChars] = useState<CharItem[]>(loadFromStorage);

  useEffect(() => {
    const handleChange = (e: Event): void => {
      const detail = (e as CustomEvent<CharItem[]>).detail;
      if (Array.isArray(detail)) {
        setAllChars(detail);
      } else {
        setAllChars(loadFromStorage());
      }
    };

    globalThis.addEventListener(CHANGE_EVENT, handleChange);
    globalThis.addEventListener("storage", handleChange);
    return () => {
      globalThis.removeEventListener(CHANGE_EVENT, handleChange);
      globalThis.removeEventListener("storage", handleChange);
    };
  }, []);

  const favoriteChars = allChars.filter((c) => c.isFavorite).map((c) => c.text);

  const addChar = (text: string): void => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const next = [...allChars, { id: Date.now().toString(), text: trimmed, isFavorite: false }];
    setAllChars(next);
    saveToStorage(next);
  };

  const deleteChar = (id: string): void => {
    const next = allChars.filter((c) => c.id !== id);
    setAllChars(next);
    saveToStorage(next);
  };

  const toggleFavorite = (id: string): void => {
    const next = allChars.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
    setAllChars(next);
    saveToStorage(next);
  };

  const reorderChars = (activeId: string, overId: string): void => {
    if (activeId === overId) return;

    setAllChars((current) => {
      const activeIndex = current.findIndex((c) => c.id === activeId);
      const overIndex = current.findIndex((c) => c.id === overId);

      if (activeIndex === -1 || overIndex === -1) return current;

      const next = [...current];
      const [activeChar] = next.splice(activeIndex, 1);
      if (!activeChar) return current;
      next.splice(overIndex, 0, activeChar);
      saveToStorage(next);
      return next;
    });
  };

  return {
    allChars,
    favoriteChars,
    addChar,
    deleteChar,
    toggleFavorite,
    reorderChars,
  };
}
