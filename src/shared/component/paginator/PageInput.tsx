import { useRef, useState, type ReactElement } from "react";
import type { KeyboardEvent } from "react";
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
        className="h-full w-6 bg-transparent p-0 text-center text-xs font-bold text-foreground"
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
      <span className="text-xs font-light text-muted-foreground">/</span>
      <span className="w-6 text-center text-xs font-semibold text-muted-foreground">
        {totalPageCount}
      </span>
    </>
  );
}
