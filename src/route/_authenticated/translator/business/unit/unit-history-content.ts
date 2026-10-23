import { unitTranslationNote, unitTypographyNote, type UnitInfo } from "./unit";
import type { UnitNotes } from "./unit-notes";

export type UnitContent = Pick<
  UnitInfo,
  "xCoord" | "yCoord" | "isBubble" | "isFlagged" | "isProofread"
> & { translatedText: string; proofreadText: string } & UnitNotes;

const contentFields = {
  xCoord: (unit: UnitInfo) => unit.xCoord,
  yCoord: (unit: UnitInfo) => unit.yCoord,
  isBubble: (unit: UnitInfo) => unit.isBubble,
  isFlagged: (unit: UnitInfo) => unit.isFlagged,
  isProofread: (unit: UnitInfo) => unit.isProofread,
  translatedText: (unit: UnitInfo) => unit.translatedText ?? "",
  proofreadText: (unit: UnitInfo) => unit.proofreadText ?? "",
  translationNote: unitTranslationNote,
  typographyNote: unitTypographyNote,
};
const contentKeys = Object.keys(contentFields) as (keyof UnitContent)[];

function setField<Key extends keyof UnitContent>(
  target: Partial<UnitContent>,
  key: Key,
  value: UnitContent[Key],
): void {
  target[key] = value;
}

export function unitContent(unit: UnitInfo): UnitContent {
  return {
    xCoord: unit.xCoord,
    yCoord: unit.yCoord,
    isBubble: unit.isBubble,
    isFlagged: unit.isFlagged,
    isProofread: unit.isProofread,
    translatedText: unit.translatedText ?? "",
    proofreadText: unit.proofreadText ?? "",
    translationNote: unitTranslationNote(unit),
    typographyNote: unitTypographyNote(unit),
  };
}

export function reverseUnitContent(
  before: UnitInfo,
  after: UnitInfo,
): Partial<UnitContent> | undefined {
  if (before === after) return;
  let reverse: Partial<UnitContent> | undefined;
  for (const field of contentKeys) {
    const previous = contentFields[field](before);
    if (Object.is(previous, contentFields[field](after))) continue;
    reverse ??= {};
    setField(reverse, field, previous);
  }
  return reverse;
}
