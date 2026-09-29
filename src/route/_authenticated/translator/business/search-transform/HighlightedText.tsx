import type { JSX } from "react/jsx-runtime";
import clsx from "clsx";
import { splitLiteralMatches } from "@/route/_authenticated/translator/business/search-transform/search-transform";

type Props = {
  text: string;
  phrase: string;
};

export function HighlightedText({ text, phrase }: Props): JSX.Element {
  return (
    <span className="whitespace-pre-wrap break-words">
      {splitLiteralMatches(text, phrase).map((segment, index) =>
        segment.matched ? (
          <mark
            key={`${String(index)}-${segment.text}`}
            className={clsx("rounded-sm bg-(--danger-faint) px-0.5 text-(--danger-soft)")}
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
