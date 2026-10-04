import { useRef, useState, type ReactElement } from "react";
import type { KeyboardEvent } from "react";
import clsx from "clsx";
import { isKeyboardComposing } from "@/shared/utility/keyboard";

type Props = {
  displayPage: number;
  totalPageCount: number;
  onChange: (index: number) => void;
};

export function PageInput({ displayPage, totalPageCount, onChange }: Props): ReactElement {
  const [value, setValue] = useState(String(displayPage));
  const skipNextBlurRef = useRef(false);

  function commit(input: string): void {
    const page = Number(input.trim());
    if (!input.trim() || !Number.isSafeInteger(page) || totalPageCount < 1) {
      setValue(String(displayPage));
      return;
    }
    const nextPage = Math.min(Math.max(page, 1), totalPageCount);
    setValue(String(nextPage));
    onChange(nextPage - 1);
  }

  return (
    <>
      <input
        value={value}
        disabled={totalPageCount === 0}
        onChange={(event) => {
          setValue(event.target.value);
        }}
        className={clsx(
          "w-6 h-full text-center text-xs font-bold",
          "bg-transparent border-none focus:outline-none",
          "text-ink-gray-900 p-0",
        )}
        onBlur={(event) => {
          if (skipNextBlurRef.current) {
            skipNextBlurRef.current = false;
            return;
          }
          commit(event.target.value);
        }}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key !== "Enter" || isKeyboardComposing(event.nativeEvent)) {
            return;
          }
          commit(event.currentTarget.value);
          skipNextBlurRef.current = true;
          event.currentTarget.blur();
        }}
        aria-label="Current page"
      />
      <span className="text-xs text-text-muted-neutral font-light select-none">/</span>
      <span className="text-xs text-ink-gray-600 font-semibold w-6 text-center">
        {totalPageCount}
      </span>
    </>
  );
}
