import { ReadOnlyDiffUnitItem } from "../unit-list/ReadOnlyDiffUnitItem";
import type { UnitItemComponent } from "../unit-list/UnitListItem";

export function unitItemComponent(): UnitItemComponent {
  return ReadOnlyDiffUnitItem;
}
