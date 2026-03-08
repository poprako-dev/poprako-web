import { useState } from "react";

export function useSpecialChars() {
  const defaultSpecialChars = ["『』", "❤", "●", "★", "☆", "♡", "○", "※"];

  const [specialChars, setSpecialChars] = useState<string[]>(() => {
    const storedChars = localStorage.getItem("specialChars");
    return storedChars
      ? (JSON.parse(storedChars) as string[])
      : defaultSpecialChars;
  });

  // 更新函数
  const updateSpecialChars = (newChars: string[]) => {
    setSpecialChars(newChars);
    localStorage.setItem("specialChars", JSON.stringify(newChars));
  };

  // 返回特殊字符列表和一个函数，用于更新这个列表
  return {
    specialChars,
    updateSpecialChars,
  };
}
