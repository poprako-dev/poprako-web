import type { JSX } from "react";
import type { ReviewerProps } from "./reviewer-props";
import { ReadOnlyReviewer } from "./ReadOnlyReviewer";
import { EditableReviewer } from "./editor/EditableReviewer";

type Props = ReviewerProps;

export function Reviewer(props: Props): JSX.Element {
  return props.editing ? (
    <EditableReviewer {...props} editing={props.editing} />
  ) : (
    <ReadOnlyReviewer {...props} />
  );
}
