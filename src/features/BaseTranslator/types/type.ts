export type UnitPayload = {
  beforeId?: string;
  xCoord: number;
  yCoord: number;
  isBubble: boolean;
  isProofread: boolean;
  translatedText: string | null;
  lastTranslatorId: string | null;
  proofreadText: string | null;
  lastProofreaderId: string | null;
};

export type UnitCreateOp = UnitPayload & {
  oper: "create";
  localId: string;
};

export type UnitSaveOp = UnitPayload & {
  oper: "save";
  id: string;
};

export type UnitDeleteOp = {
  oper: "delete";
  id: string;
};

export type UnitOp = UnitCreateOp | UnitSaveOp | UnitDeleteOp;

export type UnitDiff = {
  ops: UnitOp[];
};
