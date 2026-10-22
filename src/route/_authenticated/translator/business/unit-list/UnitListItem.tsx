import type { JSX } from "react/jsx-runtime";
import { memo, type ComponentType, type ComponentProps } from "react";
import { unitId, type UnitInfo } from "../unit/unit";
import type { UnitEdit } from "../unit/unit-edit";
import type { UserInfo } from "@/route/business/identity/user";
import type { useUnitReorder } from "./use-unit-reorder";
import type { UnitListProps } from "./UnitList";
import type { TranslateModeUnitItem } from "./TranslateModeUnitItem";
import { useUnitAnnotationControls } from "./use-unit-annotation-controls";
import { UnitAnnotationEditor } from "./UnitAnnotationEditor";

export type UnitItemComponent = ComponentType<ComponentProps<typeof TranslateModeUnitItem>>;

type Props = {
  ItemComponent: UnitItemComponent;
  annotations: UnitListProps["annotations"];
  isAnnotationEditingEnabled: boolean;
  unit: UnitInfo;
  hasLocalDraft: boolean;
  isFocused: boolean;
  onFocusUnit: UnitListProps["onFocusUnit"];
  activateIndex: (unitId: string) => void;
  translator: UserInfo | undefined;
  proofreader: UserInfo | undefined;
  canToggleBubble: boolean;
  onModifyUnit: ((unitId: string, unit: UnitEdit) => void) | undefined;
  canReorder: boolean;
  handleIndexPointerDown: ReturnType<typeof useUnitReorder>["handleIndexPointerDown"];
  isDragging: boolean;
  isDragDimmed: boolean;
  readOnly: boolean;
  specialCharInsertRequest: UnitListProps["specialCharInsertRequest"];
  specialCharsBar: UnitListProps["specialCharsBar"];
  onSpecialCharUse: UnitListProps["onSpecialCharUse"];
  onSpecialCharInserted: UnitListProps["onSpecialCharInserted"];
};

function UnitListItemView(props: Props): JSX.Element {
  const { unit } = props;
  const annotation = useUnitAnnotationControls(
    props.annotations,
    unitId(unit),
    props.readOnly,
    props.isAnnotationEditingEnabled && props.isFocused,
  );
  const commonProps = {
    annotationEditor: props.annotations && <UnitAnnotationEditor {...annotation} />,
    unit,
    hasLocalDraft: props.hasLocalDraft,
    isFocused: props.isFocused,
    onSelect: props.onFocusUnit,
    onIndexActivate: props.activateIndex,
    translator: props.translator,
    proofreader: props.proofreader,
    dataUnitId: unitId(unit),
  };
  const { ItemComponent } = props;
  return (
    <ItemComponent
      {...commonProps}
      canToggleBubble={props.canToggleBubble}
      onModifyUnit={props.onModifyUnit}
      onIndexPointerDown={props.canReorder ? props.handleIndexPointerDown : undefined}
      isDragging={props.isDragging}
      isDragDimmed={props.isDragDimmed}
      showDropIndicator={props.isDragging}
      enableReadOnly={props.readOnly}
      specialCharInsertRequest={props.specialCharInsertRequest}
      specialCharsBar={props.specialCharsBar}
      onSpecialCharUse={props.onSpecialCharUse}
      onSpecialCharInserted={props.onSpecialCharInserted}
    />
  );
}

export const UnitListItem = memo(UnitListItemView);
