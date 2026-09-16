/* eslint-disable @eslint-react/no-forward-ref -- imperative textarea ref API. */
import React, { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  className?: string | undefined;
  readOnly?: boolean | undefined;
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement> | undefined;
}

const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, Props>(
  ({ value, onChange, placeholder, className, readOnly, onFocus }, ref) => {
    const localRef = useRef<HTMLTextAreaElement>(null);

    const combinedRef = (node: HTMLTextAreaElement | null) => {
      localRef.current = node;
      if (typeof ref === "function") {ref(node);}
      else if (ref) {ref.current = node;}
    };

    useLayoutEffect(() => {
      if (!localRef.current) {
        return;
      }

      localRef.current.style.height = "auto";
      localRef.current.style.height = `${String(localRef.current.scrollHeight)}px`;
    }, [value]);

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
