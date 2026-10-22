import type { ApiClient } from "@/api/client";
import type { Result } from "@/shared/utility/result";

export type UnitApiInfo = {
  id: string;
  pageId: string;
  xCoord: number;
  yCoord: number;
  isBubble: boolean;
  isFlagged: boolean;
  translatedText?: string | null | undefined;
  lastTranslatorId?: string | null | undefined;
  isProofread: boolean;
  proofreadText?: string | null | undefined;
  lastProofreaderId?: string | null | undefined;
  translationNote?: string | null | undefined;
  typographyNote?: string | null | undefined;
  createdAt: number;
  updatedAt: number;
};

export type ListPageUnitsResponse = {
  totalUnitCount: number;
  translatedUnitCount: number;
  proofreadUnitCount: number;
  unitInfos?: UnitApiInfo[] | undefined;
};

// Patch fields use explicit tags; omission means Skip, while null cannot Clear.
export type UnitPatch<Value> = { type: "clear" } | { type: "assign"; value: Value };
export type UnitCoord = { xCoord: number; yCoord: number };
export type UnitTranslation = { translatedText: string };
export type UnitRevision = { isProofread: boolean; proofreadText?: string | undefined };

export type CreateUnitEdit = {
  edit: "create";
  localId: string;
  nextId?: string | null | undefined;
  isBubble: boolean;
  isFlagged: boolean;
  coord: UnitCoord;
  translation?: UnitTranslation | null | undefined;
  revision?: UnitRevision | null | undefined;
  translationNote?: string | null | undefined;
  typographyNote?: string | null | undefined;
};

export type PatchUnitEdit = {
  edit: "patch";
  id: string;
  nextId?: UnitPatch<string> | undefined;
  isBubble?: boolean | undefined;
  isFlagged?: boolean | undefined;
  coord?: UnitCoord | undefined;
  translation?: UnitPatch<UnitTranslation> | undefined;
  revision?: UnitPatch<UnitRevision> | undefined;
  translationNote?: UnitPatch<string> | undefined;
  typographyNote?: UnitPatch<string> | undefined;
};

export type DeleteUnitEdit = { edit: "delete"; id: string };
export type UnitEditOperation = CreateUnitEdit | PatchUnitEdit | DeleteUnitEdit;
export type CreatedUnitId = { localId: string; unitId: string };
export type SavePageUnitsResponse = { createdUnitIds: CreatedUnitId[] };

export function listPageUnits(
  client: ApiClient,
  pageId: string,
  options: { signal?: AbortSignal | undefined; timeoutMs?: number | undefined } = {},
): Promise<Result<ListPageUnitsResponse>> {
  return client.get<ListPageUnitsResponse>(`/pages/${pageId}/units`, {
    timeoutMs: options.timeoutMs,
    signal: options.signal,
  });
}

export function savePageUnits(
  client: ApiClient,
  pageId: string,
  edits: readonly UnitEditOperation[],
  saveId: string,
  options: { signal?: AbortSignal | undefined; timeoutMs?: number | undefined } = {},
): Promise<Result<SavePageUnitsResponse>> {
  return client.post<SavePageUnitsResponse>(`/pages/${pageId}/units/save`, edits, {
    query: { saveId },
    timeoutMs: options.timeoutMs,
    signal: options.signal,
  });
}
