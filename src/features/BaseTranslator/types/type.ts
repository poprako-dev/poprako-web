export type UnitCoord = {
  xCoord: number;
  yCoord: number;
};

export type UnitTranslation = {
  translatedText: string;
};

export type UnitRevision = {
  isProofread: boolean;
  proofreadText?: string;
};

export type Patch<T> =
  | { type: "skip" }
  | { type: "clear" }
  | { type: "assign"; value: T };

export type UnitCreateOp = {
  edit: "create";
  localId: string;
  nextId?: string;
  isBubble: boolean;
  coord: UnitCoord;
  translation?: UnitTranslation;
  revision?: UnitRevision;
};

export type UnitPatchOp = {
  edit: "patch";
  id: string;
  nextId: Patch<string>;
  isBubble?: boolean;
  coord?: UnitCoord;
  translation: Patch<UnitTranslation>;
  revision: Patch<UnitRevision>;
};

export type UnitDeleteOp = {
  edit: "delete";
  id: string;
};

export type UnitOp = UnitCreateOp | UnitPatchOp | UnitDeleteOp;

export type UnitDiff = {
  ops: UnitOp[];
};
