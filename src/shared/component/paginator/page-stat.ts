export type PageStat = {
  hasLocalDraft?: boolean | undefined;
  pageId: string;
  flaggedUnits?: number;
} & (
  | { totalUnits: number; translatedUnits: number; proofreadUnits: number }
  | { totalUnits?: never; translatedUnits?: never; proofreadUnits?: never }
);
