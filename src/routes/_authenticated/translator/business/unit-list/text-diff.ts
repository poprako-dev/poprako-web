import { diffArrays } from "diff";

export type UnitTextDiffPart = {
  kind: "unchanged" | "deleted" | "inserted" | "replacement-removed" | "replacement-added";
  text: string;
};

type RawDiffPart = {
  kind: "unchanged" | "removed" | "added";
  text: string;
};

const graphemeSegmenter =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("zh", { granularity: "grapheme" })
    : undefined;

function tokenizeText(text: string): string[] {
  if (!graphemeSegmenter) {
    return [...text]; // eslint-disable-line @typescript-eslint/no-misused-spread
  }
  // CRLF is one grapheme, but its LF must still align with an existing LF.
  return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment).flatMap((segment) =>
    segment === "\r\n" ? ["\r", "\n"] : [segment],
  );
}

function mergeAdjacentParts(parts: UnitTextDiffPart[]): UnitTextDiffPart[] {
  const merged: UnitTextDiffPart[] = [];
  for (const part of parts) {
    const previous = merged.at(-1);
    if (previous?.kind === part.kind) {
      previous.text += part.text;
      continue;
    }
    merged.push({ ...part });
  }
  return merged;
}

function orderReplacementParts(parts: RawDiffPart[]): UnitTextDiffPart[] {
  const ordered: UnitTextDiffPart[] = [];
  let index = 0;

  while (index < parts.length) {
    const part = parts[index];
    if (!part) break;
    if (part.kind === "unchanged") {
      ordered.push({ kind: "unchanged", text: part.text });
      index += 1;
      continue;
    }

    const changed: RawDiffPart[] = [];
    while (index < parts.length && parts[index]?.kind !== "unchanged") {
      const changedPart = parts[index];
      if (changedPart) {
        changed.push(changedPart);
        index += 1;
      } else {
        index = parts.length;
      }
    }
    // Whitespace edits must not turn adjacent text additions into replacements.
    const hasRemovedText = changed.some((part) => part.kind === "removed" && /\S/u.test(part.text));
    const hasAddedText = changed.some((part) => part.kind === "added" && /\S/u.test(part.text));
    for (const kind of ["removed", "added"] as const) {
      const changesOfKind = changed.filter((part) => part.kind === kind);
      for (const change of changesOfKind) {
        const fragments = change.text.match(/\s+|\S+/gu) ?? [];
        for (const text of fragments) {
          const isReplacement = hasRemovedText && hasAddedText && /\S/u.test(text);
          ordered.push({
            kind:
              kind === "removed"
                ? isReplacement
                  ? "replacement-removed"
                  : "deleted"
                : isReplacement
                  ? "replacement-added"
                  : "inserted",
            text,
          });
        }
      }
    }
  }

  return mergeAdjacentParts(ordered);
}

export function buildUnitTextDiff(
  translatedText: string | null,
  proofreadText: string | null,
): UnitTextDiffPart[] {
  if (!proofreadText) {
    return translatedText ? [{ kind: "unchanged", text: translatedText }] : [];
  }

  const changes = diffArrays(tokenizeText(translatedText ?? ""), tokenizeText(proofreadText));
  const parts = changes.map<RawDiffPart>((change) => ({
    kind: change.removed ? "removed" : change.added ? "added" : "unchanged",
    text: change.value.join(""),
  }));

  return orderReplacementParts(parts);
}
