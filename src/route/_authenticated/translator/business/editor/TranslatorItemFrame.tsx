import type { ComponentPropsWithRef, JSX, ReactNode } from "react";
import clsx from "clsx";
type Props = ComponentPropsWithRef<"div"> & {
  isFocused: boolean;
  leading: ReactNode;
  decoration?: ReactNode;
};
export function TranslatorItemFrame({
  isFocused,
  leading,
  decoration,
  children,
  className,
  ...props
}: Props): JSX.Element {
  return (
    <div
      {...props}
      className={clsx(
        "relative flex cursor-text items-stretch border-y border-line-stone-200",
        "first:border-t-0 last:border-b-0 transition-all duration-75",
        isFocused ? "z-10 bg-surface-stone-300/50" : "bg-transparent hover:bg-surface-stone-100/70",
        className,
      )}
    >
      {decoration}
      {leading}
      <div className="flex min-w-0 flex-1 flex-col justify-center px-2 py-2">{children}</div>
    </div>
  );
}
