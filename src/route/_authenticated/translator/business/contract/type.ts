export type UnitCoord = {
  xCoord: number;
  yCoord: number;
};

export type UnitTranslation = {
  translatedText: string;
};

export type UnitRevision = {
  // 仅表示校对流程状态；与 proofreadText 完全独立，二者不得互相推导或隐式修改。
  isProofread: boolean;
  proofreadText?: string | undefined;
};

export type Patch<T> = { type: "skip" } | { type: "clear" } | { type: "assign"; value: T };

export type UnitCreateOp = {
  edit: "create";
  localId: string;
  nextId?: string | undefined;
  isBubble: boolean;
  isFlagged: boolean;
  coord: UnitCoord;
  translation?: UnitTranslation | undefined;
  revision?: UnitRevision | undefined;
};

export type UnitPatchOp = {
  edit: "patch";
  id: string;
  nextId: Patch<string>;
  isBubble?: boolean | undefined;
  isFlagged?: boolean | undefined;
  coord?: UnitCoord | undefined;
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

export type CreatedUnitId = {
  localId: string;
  unitId: string;
};

export type UnitSaveResult = {
  createdUnitIds: CreatedUnitId[];
};

export type SaveUnits = (pageId: string, diff: UnitDiff, saveId: string) => Promise<UnitSaveResult>;
