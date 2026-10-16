import { applyPatches, enablePatches, produceWithPatches, type Patch } from "immer";
import { normalizeUnitIndexes, type UnitInfo } from "./unit";

enablePatches();

type UnitContent = Pick<
  UnitInfo,
  "xCoord" | "yCoord" | "isBubble" | "isFlagged" | "isProofread"
> & { translatedText: string; proofreadText: string };
type UnitDocument = { order: string[]; units: Record<string, UnitContent> };

function content(unit: UnitInfo): UnitContent {
  return {
    xCoord: unit.xCoord,
    yCoord: unit.yCoord,
    isBubble: unit.isBubble,
    isFlagged: unit.isFlagged,
    isProofread: unit.isProofread,
    translatedText: unit.translatedText ?? "",
    proofreadText: unit.proofreadText ?? "",
  };
}

function documentOf(units: UnitInfo[]): UnitDocument {
  return {
    order: units.map((unit) => unit.id),
    units: Object.fromEntries(units.map((unit) => [unit.id, content(unit)])),
  };
}

function updateDocument(draft: UnitDocument, next: UnitDocument): void {
  if (
    draft.order.length !== next.order.length ||
    draft.order.some((id, i) => id !== next.order[i])
  ) {
    draft.order = next.order;
  }
  for (const id of Object.keys(draft.units)) {
    if (!Object.hasOwn(next.units, id)) Reflect.deleteProperty(draft.units, id);
  }
  for (const [id, unit] of Object.entries(next.units)) {
    const previous = draft.units[id];
    if (!previous) {
      draft.units[id] = unit;
      continue;
    }
    Object.assign(previous, unit);
  }
}

/** Only editable content travels through history; identity and authors stay current. */
export class UnitHistory {
  private readonly entries: Patch[][] = [];
  private readonly metadata = new Map<string, UnitInfo>();

  get canUndo(): boolean {
    return this.entries.length > 0;
  }

  record(before: UnitInfo[], after: UnitInfo[]): boolean {
    this.remember(before);
    this.remember(after);
    const [, patches, reverse] = produceWithPatches(documentOf(before), (draft) => {
      updateDocument(draft, documentOf(after));
    });
    if (!patches.length) return false;
    this.entries.push(reverse);
    return true;
  }

  undo(current: UnitInfo[]): UnitInfo[] | undefined {
    const reverse = this.entries.pop();
    if (!reverse) return;
    this.remember(current);
    const restored = applyPatches(documentOf(current), reverse);
    return normalizeUnitIndexes(restored.order.map((id) => this.restoreUnit(id, restored)));
  }

  clear(): void {
    this.entries.length = 0;
    this.metadata.clear();
  }

  private remember(units: UnitInfo[]): void {
    for (const unit of units) this.metadata.set(unit.id, unit);
  }

  private restoreUnit(id: string, document: UnitDocument): UnitInfo {
    const unit = document.units[id];
    if (!unit) throw new Error("回退文档缺少 Unit 内容");
    const metadata = this.metadata.get(id);
    return {
      ...metadata,
      ...unit,
      id,
      index: 0,
      translatorId: unit.translatedText ? metadata?.translatorId : undefined,
      proofreaderId: unit.proofreadText ? metadata?.proofreaderId : undefined,
    };
  }
}
