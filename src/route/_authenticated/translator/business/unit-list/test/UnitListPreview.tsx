import type { JSX } from "react";
import type { UnitListProps } from "../UnitList";
import { EditingUnitList } from "../EditingUnitList";
import { ReadOnlyUnitList } from "../ReadOnlyUnitList";

type Props = UnitListProps;

export function UnitList(props: Props): JSX.Element {
  return props.mode === "readOnly" ? (
    <ReadOnlyUnitList {...props} />
  ) : (
    <EditingUnitList {...props} />
  );
}
