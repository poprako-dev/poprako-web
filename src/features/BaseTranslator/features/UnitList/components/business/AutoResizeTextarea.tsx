import React, { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
};

const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, Props>(
  ({ value, onChange, placeholder, className, readOnly, onFocus }, ref) => {
    const localRef = useRef<HTMLTextAreaElement>(null);

    const combinedRef = (node: HTMLTextAreaElement | null) => {
      (localRef as React.MutableRefObject<HTMLTextAreaElement | null>).current =
        node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    useLayoutEffect(() => {
      if (localRef.current) {
        localRef.current.style.height = "auto";
        localRef.current.style.height = `${localRef.current.scrollHeight}px`;
      }
    }, [value]);

    return (
      <textarea
        ref={combinedRef}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        rows={1}
        readOnly={readOnly}
        className={cn(
          "w-full resize-none overflow-hidden bg-transparent focus:outline-none transition-colors block",
          className,
        )}
        style={{ minHeight: "1.2em" }}
      />
    );
  },
);

AutoResizeTextarea.displayName = "AutoResizeTextarea";

export default AutoResizeTextarea;
