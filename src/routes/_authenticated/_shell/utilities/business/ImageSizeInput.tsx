import type { JSX } from "react";
import clsx from "clsx";
import { limitBytes } from "@/routes/_authenticated/_shell/utilities/business/bounded-images";
type Props = {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
};

export function ImageSizeInput({ label, value, disabled, onChange }: Props): JSX.Element {
  return (
    <label className="block text-xs text-muted-foreground">
      <span className="block max-w-36 truncate" title={label}>
        {label}
      </span>
      <span className="mt-1 flex items-center gap-2">
        <input
          type="number"
          min="1"
          step="1"
          value={value}
          disabled={disabled}
          aria-label={label}
          aria-invalid={limitBytes(value) === null}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          className={clsx(
            "h-9 w-24 rounded-md border border-input bg-background px-2 text-sm text-foreground",
            "focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50",
            "aria-invalid:border-destructive",
          )}
        />
        KiB
      </span>
    </label>
  );
}
