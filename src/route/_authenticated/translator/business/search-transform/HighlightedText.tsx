import type { JSX as TranslatorImportedType0 } from "react/jsx-runtime";
import clsx from "clsx";
import { splitLiteralMatches } from "@/route/_authenticated/translator/business/search-transform/search-transform";

type Props = {
  text: string;
  phrase: string;
};

export function HighlightedText({ text, phrase }: Props): TranslatorImportedType0.Element {
  return (
    <span className="whitespace-pre-wrap break-words">
      {splitLiteralMatches(text, phrase).map((segment, index) =>
        segment.matched ? (
          <mark
            key={`${String(index)}-${segment.text}`}
            className={clsx("rounded-sm bg-destructive/10 px-0.5 text-destructive")}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={`${String(index)}-${segment.text}`}>{segment.text}</span>
        ),
      )}
    </span>
  );
}
