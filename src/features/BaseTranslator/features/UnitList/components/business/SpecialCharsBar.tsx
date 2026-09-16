import clsx from "clsx";
/* eslint-disable @eslint-react/dom-no-missing-button-type */
/* eslint-disable @eslint-react/no-array-index-key -- fixed symbol palette. */
import { useSpecialChars } from "@/hook/useSpecialChars";

interface Props {
  onInsert: (char: string) => void;
  onUseChar?: ((char: string) => void) | undefined;
}

export default function SpecialCharsBar({ onInsert, onUseChar }: Props) {
  const { favoriteChars } = useSpecialChars();

  return (
    <div className="flex flex-wrap gap-1 animate-in fade-in slide-in-from-top-1">
      {favoriteChars.map((char, index) => (
        <button
          key={index}
          onMouseDown={(e) => {
            e.preventDefault(); // 阻止焦点转移
            onUseChar?.(char);
            onInsert(char);
          }}
          className={clsx(
            "px-1 py-0.5 text-xs bg-gray-100 hover:bg-green-50 text-gray-500",
            "hover:text-green-500 rounded border border-gray-200",
            "hover:border-(--color-border-green-200) transition-colors font-mono",
            "min-w-6 text-center",
          )}
        >
          {char}
        </button>
      ))}
    </div>
  );
}
