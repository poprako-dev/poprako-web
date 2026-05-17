import { useState } from "react";

export type CharItem = {
  id: string;
  text: string;
  isFavorite: boolean;
};

const STORAGE_KEY = "specialChars_v2";

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

function saveToStorage(chars: CharItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chars));
}

export function useSpecialChars() {
  const [allChars, setAllChars] = useState<CharItem[]>(loadFromStorage);

  const favoriteChars = allChars
    .filter((c) => c.isFavorite)
    .map((c) => c.text);

  const addChar = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const next = [
      ...allChars,
      { id: Date.now().toString(), text: trimmed, isFavorite: false },
    ];
    setAllChars(next);
    saveToStorage(next);
  };

  const deleteChar = (id: string) => {
    const next = allChars.filter((c) => c.id !== id);
    setAllChars(next);
    saveToStorage(next);
  };

  const toggleFavorite = (id: string) => {
    const next = allChars.map((c) =>
      c.id === id ? { ...c, isFavorite: !c.isFavorite } : c,
    );
    setAllChars(next);
    saveToStorage(next);
  };

  return {
    allChars,
    favoriteChars,
    addChar,
    deleteChar,
    toggleFavorite,
  };
}
