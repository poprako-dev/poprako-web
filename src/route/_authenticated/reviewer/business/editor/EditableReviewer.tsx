import type { JSX } from "react";
import { WorkbenchLayout } from "@/shared/component/WorkbenchLayout";
import { useReviewEditor, type EditableReviewerProps } from "./use-review-editor";
import { ReviewEditorCanvas } from "./ReviewEditorCanvas";
import { ReviewEditorSidebar } from "./ReviewEditorSidebar";
import { ReviewEditorDialogs } from "./ReviewEditorDialogs";

type Props = EditableReviewerProps;

export function EditableReviewer(props: Props): JSX.Element {
  const editor = useReviewEditor(props);
  return (
    <>
      <WorkbenchLayout
        canvas={<ReviewEditorCanvas editor={editor} />}
        sidebar={<ReviewEditorSidebar editor={editor} />}
      />
      <ReviewEditorDialogs editor={editor} />
    </>
  );
}
