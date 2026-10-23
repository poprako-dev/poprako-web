import type { JSX } from "react";
import { UnitList, type UnitListProps } from "./UnitList";
import { ReadOnlyDiffUnitItem } from "./ReadOnlyDiffUnitItem";

type Props = UnitListProps;

export function ReadOnlyUnitList(props: Props): JSX.Element {
  return <UnitList {...props} ItemComponent={ReadOnlyDiffUnitItem} />;
}
