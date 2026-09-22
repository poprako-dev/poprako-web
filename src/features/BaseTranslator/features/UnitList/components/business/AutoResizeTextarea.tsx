/* eslint-disable @eslint-react/no-forward-ref -- imperative textarea ref API. */
import React, { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Props convention.
type Props = {
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  className?: string | undefined;
  readOnly?: boolean | undefined;
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement> | undefined;
};

function resizeTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  textarea.style.height = `${String(textarea.scrollHeight)}px`;
}

const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, Props>(
  ({ value, onChange, placeholder, className, readOnly, onFocus }, ref) => {
    const localRef = useRef<HTMLTextAreaElement>(null);

    function combinedRef(node: HTMLTextAreaElement | null) {
      localRef.current = node;
      if (typeof ref === "function") {ref(node);}
      else if (ref) {ref.current = node;}
    }

    useLayoutEffect(() => {
      if (!localRef.current) {
        return;
      }

      resizeTextarea(localRef.current);
    }, [value, className, placeholder]);

    useLayoutEffect(() => {
      const textarea = localRef.current;
      if (!textarea) {return;}

      let previousWidth = textarea.getBoundingClientRect().width;
      const observer = new ResizeObserver(() => {
        const width = textarea.getBoundingClientRect().width;
        if (width === previousWidth) {return;}
        previousWidth = width;
        if (width > 0) {resizeTextarea(textarea);}
      });
      observer.observe(textarea);
      return () => { observer.disconnect(); };
    }, []);

    return (
      <textarea
        ref={combinedRef}
        value={value ?? ""}
        onChange={(e) => { onChange(e.target.value); }}
        onFocus={onFocus}
        placeholder={placeholder}
        rows={1}
        readOnly={readOnly}
        className={cn(
          "w-full resize-none overflow-hidden bg-transparent focus:outline-none",
          "transition-colors block",
          className,
        )}
        style={{ minHeight: "1.2em" }}
      />
    );
  },
);

AutoResizeTextarea.displayName = "AutoResizeTextarea";

export default AutoResizeTextarea;
