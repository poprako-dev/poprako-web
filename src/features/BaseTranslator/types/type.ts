export type UnitSaveOp = {
  id?: string;
  localId?: string;
  beforeId?: string;
  xCoord?: number;
  yCoord?: number;
  isBubble?: boolean;
  isProofread?: boolean;
  translatedText?: string | null;
  lastTranslatorId?: string | null;
  proofreadText?: string | null;
  lastProofreaderId?: string | null;
};

export type UnitDeleteOp = {
  id: string;
};

export type UnitOp = UnitSaveOp | UnitDeleteOp;

export type UnitDiff = {
  ops: UnitOp[];
};
