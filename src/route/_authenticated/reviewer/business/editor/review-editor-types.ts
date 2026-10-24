import type { Dispatch, RefObject, SetStateAction } from "react";
import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";
import type { CanvasHandle } from "@/shared/component/PageCanvas";
import type { PageRect } from "@/shared/utility/page-geometry";
import type { usePageInteraction } from "@/shared/hook/use-page-interaction";
import type { useRelocationPreference } from "@/shared/hook/use-relocation-preference";
import type { ReviewWorkspace } from "../issue/use-review-workspace";
import type { ReviewSession } from "./review-session";
import type { ReviewEditPage } from "./review-editing";
import type { EditableReviewerProps } from "./use-review-editor";
import type { IssueGesture } from "./use-issue-gesture";

type Setter<T> = Dispatch<SetStateAction<T>>;
export type EditorState = {
  session: ReviewSession;
  pages: Readonly<Record<string, ReviewEditPage>>;
  page: ReviewEditPage | undefined;
  pageIndex: number;
  pageId: string;
  setPageIndex: Setter<number>;
  selectedId: string | null;
  select: Setter<string | null>;
  focusInput: string | null;
  setFocusInput: Setter<string | null>;
  drawing: { id: string | null } | null;
  setDrawing: Setter<{ id: string | null } | null>;
  visible: boolean;
  setVisible: Setter<boolean>;
  deleteId: string | null;
  setDeleteId: Setter<string | null>;
  confirmComplete: boolean;
  setConfirmComplete: Setter<boolean>;
  completing: boolean;
  setCompleting: Setter<boolean>;
  completed: boolean;
  setCompleted: Setter<boolean>;
  error: string | null;
  setError: Setter<string | null>;
  canvasRef: RefObject<CanvasHandle | null>;
  relocation: ReturnType<typeof useRelocationPreference>;
};
export interface EditorCommands {
  perform: (operation: () => Promise<void>) => Promise<void>;
  navigate: (index: number) => Promise<void>;
  modify: (id: string, patch: Partial<IssueInfo>) => void;
  add: (rect: PageRect | null) => void;
  select: (id: string | null, relocate?: boolean) => void;
}
export interface CompletionActions {
  complete: () => Promise<void>;
  save: () => void;
  exit: () => void;
}
export type ReviewEditor = Omit<EditorState, "select"> &
  EditorCommands &
  CompletionActions & {
    review: ReviewWorkspace;
    interaction: ReturnType<typeof usePageInteraction>;
    gesture: IssueGesture;
    disabled: boolean;
    status: string;
    props: EditableReviewerProps;
  };
