import type { JSX as TranslatorImportedType0 } from "react/jsx-runtime";
import type { EditorProps } from "./editor/editor-props";
import { useEditorSession } from "./editor/use-editor-session";
import { EditorCanvas } from "./editor/EditorCanvas";
import { EditorSidebar } from "./editor/EditorSidebar";
import { EditorDialog } from "./editor/EditorDialog";
import { BaseTranslatorLayout } from "./editor/BaseTranslatorLayout";
export function BaseTranslator(props: EditorProps): TranslatorImportedType0.Element {
  const session = useEditorSession(props);
  return (
    <>
      <BaseTranslatorLayout
        canvas={<EditorCanvas session={session} />}
        sidebar={<EditorSidebar session={session} />}
      />
      <EditorDialog session={session} />
    </>
  );
}
