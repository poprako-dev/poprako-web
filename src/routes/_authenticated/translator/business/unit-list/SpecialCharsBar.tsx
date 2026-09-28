import type { JSX as TranslatorImportedType0 } from "react/jsx-runtime";
import clsx from "clsx";
import { Grip, Undo2 } from "lucide-react";
import { useSpecialChars } from "@/routes/_authenticated/translator/business/preference/use-special-chars";
import type { SpecialCharsBarController } from "@/routes/_authenticated/translator/business/preference/use-detachable-special-chars-bar";

type Props = {
  onInsert: (char: string) => void;
  onUseChar?: ((char: string) => void) | undefined;
  controller?: SpecialCharsBarController | undefined;
  isFloating?: boolean;
  isDisabled?: boolean;
};

export function SpecialCharsBar({
  onInsert,
  onUseChar,
  controller,
  isFloating = false,
  isDisabled = false,
}: Props): TranslatorImportedType0.Element | null {
  const { allChars } = useSpecialChars();
  if (!isFloating && controller?.position) {
    return controller.placeholderHeight === null ? null : (
      <div aria-hidden="true" style={{ height: controller.placeholderHeight }} />
    );
  }

  const favoriteChars = allChars.filter((char) => char.isFavorite);

  return (
    <div
      data-special-chars-bar
      role="group"
      aria-label="优选符号"
      className={clsx(
        "flex min-w-0 items-start gap-1 p-1",
        isFloating && "rounded bg-background shadow-sm outline outline-1 outline-border",
      )}
    >
      <div
        className="flex min-w-0 flex-1 flex-wrap gap-1 overflow-y-auto"
        style={
          isFloating && controller?.position
            ? { maxHeight: Math.max(0, controller.position.maxHeight - 10) }
            : undefined
        }
      >
        {favoriteChars.map((char) => (
          <button
            key={char.id}
            type="button"
            disabled={isDisabled || controller?.isEnabled === false}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              onUseChar?.(char.text);
              onInsert(char.text);
            }}
            className={clsx(
              "min-w-6 max-w-full rounded border border-border bg-muted px-1 py-0.5",
              "text-center font-mono text-xs text-muted-foreground break-all",
              "transition-colors hover:border-primary-border hover:bg-primary-subtle",
              "hover:text-primary-text disabled:pointer-events-none disabled:opacity-40",
            )}
          >
            {char.text}
          </button>
        ))}
        {favoriteChars.length === 0 && (
          <span className="py-1 text-xs text-muted-foreground">尚无优选符号</span>
        )}
      </div>
      {isFloating && controller && (
        <button
          type="button"
          title="放回符号栏"
          aria-label="放回符号栏"
          onPointerDown={(event) => {
            event.preventDefault();
          }}
          onClick={controller.dock}
          className={clsx(
            "flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground",
            "hover:bg-primary-subtle hover:text-primary-text",
          )}
        >
          <Undo2 size={16} />
        </button>
      )}
      {controller && (
        <button
          type="button"
          title={isFloating ? "拖动符号栏" : "拖出符号栏"}
          aria-label={isFloating ? "拖动符号栏" : "拖出符号栏"}
          disabled={!controller.isEnabled}
          onPointerDown={controller.handleGripPointerDown}
          onContextMenu={(event) => {
            event.preventDefault();
          }}
          className={clsx(
            "flex size-6 shrink-0 touch-none items-center justify-center rounded select-none",
            "transition-colors",
            controller.isGripHeld
              ? "cursor-grabbing bg-primary-subtle text-primary-text"
              : "cursor-grab text-muted-foreground hover:bg-muted",
          )}
        >
          <Grip size={16} />
        </button>
      )}
    </div>
  );
}
