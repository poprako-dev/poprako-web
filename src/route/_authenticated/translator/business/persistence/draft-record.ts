import type { UnitInfo } from "../unit/unit";
import type { UnitDiff } from "../contract/type";

export type SaveBatch = { saveId: string; diff: UnitDiff; target: UnitInfo[]; wire?: UnitDiff };
export type DraftRecord = {
  version: 1;
  revision: number;
  units: UnitInfo[];
  baseline: UnitInfo[];
  pending: SaveBatch[];
  identities: [string, string][];
};
export type DraftMap = Record<string, DraftRecord>;

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function text(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}
function coord(value: unknown): boolean {
  return (
    object(value) &&
    typeof value["xCoord"] === "number" &&
    Number.isFinite(value["xCoord"]) &&
    typeof value["yCoord"] === "number" &&
    Number.isFinite(value["yCoord"])
  );
}
function units(value: unknown): value is UnitInfo[] {
  return (
    Array.isArray(value) &&
    value.every(
      (u: unknown) =>
        object(u) &&
        coord(u) &&
        typeof u["id"] === "string" &&
        typeof u["index"] === "number" &&
        Number.isInteger(u["index"]) &&
        typeof u["isBubble"] === "boolean" &&
        typeof u["isFlagged"] === "boolean" &&
        typeof u["isProofread"] === "boolean" &&
        [
          u["translatedText"],
          u["proofreadText"],
          u["translatorId"],
          u["proofreaderId"],
          u["translatorCommnet"],
          u["proofreaderComment"],
        ].every(text),
    ) &&
    new Set(value.map((u: UnitInfo) => u.id)).size === value.length
  );
}
function translation(value: unknown): boolean {
  return object(value) && typeof value["translatedText"] === "string";
}
function revision(value: unknown): boolean {
  return object(value) && typeof value["isProofread"] === "boolean" && text(value["proofreadText"]);
}
function patch(value: unknown, valid: (value: unknown) => boolean): boolean {
  return (
    object(value) &&
    (value["type"] === "skip" ||
      value["type"] === "clear" ||
      (value["type"] === "assign" && valid(value["value"])))
  );
}
function diff(value: unknown): boolean {
  return (
    object(value) &&
    Array.isArray(value["ops"]) &&
    value["ops"].length <= 100 &&
    value["ops"].every((op: unknown) => {
      if (!object(op)) return false;
      if (op["edit"] === "delete") return typeof op["id"] === "string";
      if (op["edit"] === "create")
        return (
          typeof op["localId"] === "string" &&
          text(op["nextId"]) &&
          coord(op["coord"]) &&
          typeof op["isBubble"] === "boolean" &&
          typeof op["isFlagged"] === "boolean" &&
          (op["translation"] === undefined || translation(op["translation"])) &&
          (op["revision"] === undefined || revision(op["revision"]))
        );
      return (
        op["edit"] === "patch" &&
        typeof op["id"] === "string" &&
        patch(op["nextId"], (v) => typeof v === "string") &&
        patch(op["translation"], translation) &&
        patch(op["revision"], revision) &&
        (op["coord"] === undefined || coord(op["coord"])) &&
        (op["isBubble"] === undefined || typeof op["isBubble"] === "boolean") &&
        (op["isFlagged"] === undefined || typeof op["isFlagged"] === "boolean")
      );
    })
  );
}
export function parseDraft(raw: string): DraftRecord {
  const value: unknown = JSON.parse(raw);
  if (
    !object(value) ||
    value["version"] !== 1 ||
    typeof value["revision"] !== "number" ||
    !Number.isSafeInteger(value["revision"]) ||
    !units(value["units"]) ||
    !units(value["baseline"]) ||
    !Array.isArray(value["identities"]) ||
    !value["identities"].every(
      (pair: unknown) =>
        Array.isArray(pair) &&
        pair.length === 2 &&
        pair.every((v: unknown) => typeof v === "string"),
    ) ||
    !Array.isArray(value["pending"]) ||
    !value["pending"].every(
      (batch: unknown) =>
        object(batch) &&
        typeof batch["saveId"] === "string" &&
        diff(batch["diff"]) &&
        units(batch["target"]) &&
        (batch["wire"] === undefined || diff(batch["wire"])),
    )
  ) {
    throw new Error("草稿损坏或版本不受支持；原始记录已保留");
  }
  return value as DraftRecord;
}
