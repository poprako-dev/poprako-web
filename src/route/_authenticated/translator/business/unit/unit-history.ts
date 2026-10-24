import { normalizeUnitIndexes, type UnitInfo } from "./unit";
import { reverseUnitContent, unitContent, type UnitContent } from "./unit-history-content";

type HistoryEntry = {
  order: string[] | undefined;
  changed: Map<string, Partial<UnitContent>>;
};

function historyEntry(before: UnitInfo[], after: UnitInfo[]): HistoryEntry | undefined {
  const reordered =
    before.length !== after.length || before.some((unit, i) => unit.id !== after[i]?.id);
  const previous = reordered ? new Map(before.map((unit) => [unit.id, unit])) : undefined;
  const changed = new Map<string, Partial<UnitContent>>();
  for (let index = 0; index < after.length; index += 1) {
    const unit = after[index];
    if (!unit) continue;
    const old = previous ? previous.get(unit.id) : before[index];
    previous?.delete(unit.id);
    if (!old) continue;
    const reverse = reverseUnitContent(old, unit);
    if (reverse) changed.set(unit.id, reverse);
  }
  if (previous) {
    for (const [id, unit] of previous) changed.set(id, unitContent(unit));
  }
  if (!reordered && !changed.size) return;
  return {
    order: reordered ? before.map((unit) => unit.id) : undefined,
    changed,
  };
}

function restoreContent(unit: UnitInfo, reverse: Partial<UnitContent>): UnitInfo {
  const translatedText = reverse.translatedText ?? unit.translatedText;
  const proofreadText = reverse.proofreadText ?? unit.proofreadText;
  return {
    ...unit,
    ...reverse,
    translatorId: translatedText ? unit.translatorId : undefined,
    proofreaderId: proofreadText ? unit.proofreaderId : undefined,
  };
}

/** Only editable content travels through history; identity and authors stay current. */
export class UnitHistory {
  private readonly entries: HistoryEntry[] = [];
  private readonly metadata = new Map<string, UnitInfo>();

  get canUndo(): boolean {
    return this.entries.length > 0;
  }

  record(before: UnitInfo[], after: UnitInfo[]): boolean {
    this.remember(before);
    this.remember(after);
    const entry = historyEntry(before, after);
    if (!entry) return false;
    this.entries.push(entry);
    return true;
  }

  undo(current: UnitInfo[]): UnitInfo[] | undefined {
    const entry = this.entries.pop();
    if (!entry) return;
    this.remember(current);
    if (!entry.order) {
      return normalizeUnitIndexes(current.map((unit) => this.restoreUnit(unit.id, unit, entry)));
    }
    const units = new Map(current.map((unit) => [unit.id, unit]));
    return normalizeUnitIndexes(
      entry.order.map((id) => this.restoreUnit(id, units.get(id), entry)),
    );
  }

  clear(): void {
    this.entries.length = 0;
    this.metadata.clear();
  }

  private remember(units: UnitInfo[]): void {
    for (const unit of units) this.metadata.set(unit.id, unit);
  }

  private restoreUnit(id: string, current: UnitInfo | undefined, entry: HistoryEntry): UnitInfo {
    const reverse = entry.changed.get(id);
    const unit = current ?? this.metadata.get(id);
    if (!unit) throw new Error("回退文档缺少翻校单元内容");
    return reverse ? restoreContent(unit, reverse) : unit;
  }
}
