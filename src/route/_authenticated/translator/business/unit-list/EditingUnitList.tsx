import type { JSX } from "react";
import { UnitList, type UnitListProps } from "./UnitList";
import { TranslateModeUnitItem } from "./TranslateModeUnitItem";
import { ProofreadModeUnitItem } from "./ProofreadModeUnitItem";

type Props = UnitListProps;

export function EditingUnitList(props: Props): JSX.Element {
  return (
    <UnitList
      {...props}
      ItemComponent={props.mode === "translate" ? TranslateModeUnitItem : ProofreadModeUnitItem}
    />
  );
}
