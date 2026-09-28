import type { JSX as TranslatorImportedType0 } from "react/jsx-runtime";
import clsx from "clsx";
import { useEffect, useMemo, useRef } from "react";
import {
  unitId,
  type UnitInfo,
  unitIsProofread,
  unitProofreadText,
  unitTranslatedText,
} from "@/route/_authenticated/translator/business/unit/unit";
import type { UserInfo } from "@/route/business/identity/user";
import { buildUnitTextDiff } from "@/route/_authenticated/translator/business/unit-list/text-diff";
import { BaseUnitItem } from "@/route/_authenticated/translator/business/unit-list/BaseUnitItem";
import { LineBreakOverlay } from "@/route/_authenticated/translator/business/unit-list/LineBreakOverlay";

type Props = {
  unit: UnitInfo;
  isFocused: boolean;
  onSelect?: ((unitId: string) => void) | undefined;
  onIndexActivate?: ((unitId: string) => void) | undefined;
  dataUnitId?: string | undefined;
  translator?: UserInfo | undefined;
  proofreader?: UserInfo | undefined;
};

export function ReadOnlyDiffUnitItem({
  unit,
  isFocused,
  onSelect,
  onIndexActivate,
  dataUnitId,
  translator,
  proofreader,
}: Props): TranslatorImportedType0.Element {
  const contentRef = useRef<HTMLDivElement>(null);
  const translatedText = unitTranslatedText(unit);
  const proofreadText = unitProofreadText(unit);
  const parts = useMemo(
    () => buildUnitTextDiff(translatedText, proofreadText),
    [proofreadText, translatedText],
  );
  const contributors = [
    ...(translator ? [{ role: "translator" as const, user: translator }] : []),
    ...(proofreadText && proofreader ? [{ role: "proofreader" as const, user: proofreader }] : []),
  ];

  useEffect(() => {
    if (isFocused && contentRef.current) {
      contentRef.current.focus({ preventScroll: true });
    } else if (!isFocused && contentRef.current && document.activeElement === contentRef.current) {
      contentRef.current.blur();
    }
  }, [isFocused]);

  return (
    <BaseUnitItem
      unit={unit}
      isFocused={isFocused}
      onIndexActivate={onIndexActivate}
      enableReadOnly
      contributors={contributors}
      dataUnitId={dataUnitId}
    >
      <div className="flex items-start gap-1">
        <div className="relative min-w-0 flex-1">
          <div
            ref={contentRef}
            role="textbox"
            aria-label="翻译与校对差异"
            aria-readonly="true"
            tabIndex={0}
            onFocus={() => onSelect?.(unitId(unit))}
            className={clsx(
              "min-h-[1.2em] pr-4 whitespace-pre-wrap break-words",
              "text-base leading-relaxed outline-none",
              isFocused ? "font-medium text-foreground" : "text-text-secondary",
            )}
          >
            {parts.length === 0 && <span className="text-muted-foreground">无翻译内容</span>}
            {parts.map((part, index) => {
              const key = `${String(index)}-${part.kind}-${part.text}`;
              if (part.kind === "deleted" || part.kind === "replacement-removed") {
                const isReplacement = part.kind === "replacement-removed";
                return (
                  <del
                    key={key}
                    title={isReplacement ? "初翻被替换" : "初翻删除"}
                    className={clsx(
                      "rounded-[2px] line-through decoration-1",
                      isReplacement
                        ? [
                            "bg-[var(--color-diff-replaced-bg)]",
                            "font-normal",
                            "text-[var(--color-diff-replaced-text)]",
                            "decoration-[var(--color-diff-replaced-text)]",
                          ]
                        : [
                            "bg-[var(--color-diff-delete-bg)]",
                            "font-light",
                            "text-[var(--color-diff-delete-text)]",
                            "decoration-[var(--color-diff-delete-text)]",
                          ],
                    )}
                  >
                    {part.text}
                  </del>
                );
              }
              if (part.kind === "inserted" || part.kind === "replacement-added") {
                const isReplacement = part.kind === "replacement-added";
                return (
                  <ins
                    key={key}
                    title={isReplacement ? "校对替换" : "校对新增"}
                    className={clsx(
                      "rounded-[2px] font-medium no-underline",
                      isReplacement
                        ? [
                            "bg-[var(--color-diff-replacement-bg)]",
                            "text-[var(--color-diff-replacement-text)]",
                          ]
                        : [
                            "bg-[var(--color-diff-insert-bg)]",
                            "text-[var(--color-diff-insert-text)]",
                          ],
                    )}
                  >
                    {part.text}
                  </ins>
                );
              }
              return <span key={key}>{part.text}</span>;
            })}
          </div>
          {parts.some((part) => part.text.includes("\n")) && (
            <LineBreakOverlay targetRef={contentRef} layoutKey={[parts, isFocused]} />
          )}
        </div>
        <div className="flex size-7 shrink-0 items-center justify-center rounded p-1">
          <div
            className={clsx(
              "size-2 rounded-full",
              unitIsProofread(unit) ? "bg-status-success" : "bg-border",
            )}
          />
        </div>
      </div>
    </BaseUnitItem>
  );
}
