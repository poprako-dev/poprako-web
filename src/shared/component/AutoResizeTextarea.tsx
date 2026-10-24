import React, { useLayoutEffect, useRef } from "react";
import { cn } from "@/shared/utility/utils";
import { useComposedText } from "@/shared/hook/use-composed-text";
import { LineBreakOverlay } from "./LineBreakOverlay";

type Props = {
  label?: string | undefined;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  className?: string | undefined;
  readOnly?: boolean | undefined;
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement> | undefined;
  ref?: React.Ref<HTMLTextAreaElement> | undefined;
};

function resizeTextarea(textarea: HTMLTextAreaElement): void {
  textarea.style.height = "auto";
  textarea.style.height = `${String(textarea.scrollHeight)}px`;
}

function assignTextareaRef(
  localRef: React.RefObject<HTMLTextAreaElement | null>,
  ref: Props["ref"],
  node: HTMLTextAreaElement | null,
): void {
  localRef.current = node;
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

export function AutoResizeTextarea({
  label,
  value,
  onChange,
  placeholder,
  className,
  readOnly,
  onFocus,
  ref,
}: Props): React.ReactElement {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const text = useComposedText(value, onChange);
  const displayText = text.value.replaceAll(/\r\n?/gu, "\n");

  function combinedRef(node: HTMLTextAreaElement | null): void {
    assignTextareaRef(localRef, ref, node);
  }

  useLayoutEffect(() => {
    if (!localRef.current) {
      return;
    }

    resizeTextarea(localRef.current);
  }, [text.value, className, placeholder]);

  useTextareaWidth(localRef);

  return (
    <div className="relative">
      <textarea
        aria-label={label}
        ref={combinedRef}
        value={text.value}
        onChange={(e) => {
          text.change(e.target.value);
        }}
        onCompositionStart={text.start}
        onCompositionEnd={(e) => {
          text.end(e.currentTarget.value);
        }}
        onFocus={onFocus}
        placeholder={placeholder}
        rows={1}
        readOnly={readOnly}
        className={cn(
          "w-full resize-none overflow-hidden bg-transparent focus:outline-none",
          "transition-colors block box-border border-0 p-0 pr-4",
          "whitespace-pre-wrap [overflow-wrap:break-word]",
          className,
        )}
        style={{ minHeight: "1.2em" }}
      />
      {displayText.includes("\n") && (
        <>
          {/* Match the native textarea's layout without inserting anything into its text. */}
          <div
            ref={mirrorRef}
            aria-hidden="true"
            className={cn(
              "pointer-events-none invisible absolute inset-0 select-none",
              "box-border w-full border-0 p-0 pr-4 whitespace-pre-wrap",
              "[overflow-wrap:break-word]",
              className,
            )}
          >
            {displayText}
          </div>
          <LineBreakOverlay targetRef={mirrorRef} contentKey={displayText} styleKey={className} />
        </>
      )}
    </div>
  );
}

function useTextareaWidth(localRef: React.RefObject<HTMLTextAreaElement | null>): void {
  useLayoutEffect(() => {
    const textarea = localRef.current;
    if (!textarea) return;

    let previousWidth = textarea.getBoundingClientRect().width;
    let resizeFrame: number | null = null;
    const observer = new ResizeObserver(() => {
      if (resizeFrame !== null) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        const width = textarea.getBoundingClientRect().width;
        if (width === previousWidth) return;
        previousWidth = width;
        if (width > 0) resizeTextarea(textarea);
      });
    });
    observer.observe(textarea);
    return () => {
      observer.disconnect();
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    };
  }, [localRef]);
}
