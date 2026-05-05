export type UnitOp = {
  id?: string;
  localId?: string;
  xCoord?: number;
  yCoord?: number;
  isBubble?: boolean;
  isProofread?: boolean;
  translatedText?: string | null;
  translatorComment?: string | null;
  lastTranslatorId?: string | null;
  proofreadText?: string | null;
  proofreaderComment?: string | null;
  lastProofreaderId?: string | null;
};

export type UnitDiff = {
  ops: UnitOp[];
  candOrder: string[];
};
