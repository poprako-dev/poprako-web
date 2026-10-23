import { reloadPage } from "@/shared/utility/reload-page";
import type { JSX } from "react/jsx-runtime";
import type { EditorProps } from "./editor/editor-props";
import { useEditorSession } from "./editor/use-editor-session";
import { useModuleResource } from "@/shared/hook/use-module-resource";
import { translatorModeModule, preloadTranslatorMode } from "./editor/translator-mode-module";
import { TranslatorModeLoadState } from "./editor/TranslatorModeLoadState";
import { WorkbenchLayout } from "@/shared/component/WorkbenchLayout";
import { EditorCanvas } from "./editor/EditorCanvas";
import { EditorSidebar } from "./editor/EditorSidebar";

export function BaseTranslator(props: EditorProps): JSX.Element {
  const session = useEditorSession(props);
  const resource = translatorModeModule(session.view);
  const snapshot = useModuleResource(resource);
  if (snapshot.status !== "ready") {
    return (
      <TranslatorModeLoadState
        error={snapshot.status === "error" ? snapshot.error : undefined}
        onReload={reloadPage}
        onExit={props.onExit}
      />
    );
  }
  const { Dialog, TerminologyBar, unitItemComponent } = snapshot.module;
  return (
    <>
      <WorkbenchLayout
        canvas={
          <EditorCanvas
            session={session}
            terminologyBar={TerminologyBar && <TerminologyBar session={session} />}
          />
        }
        sidebar={
          <EditorSidebar
            session={session}
            annotations={props.annotations}
            ItemComponent={unitItemComponent(session.view)}
            onPreloadMode={() => {
              if (session.nextView)
                void preloadTranslatorMode(session.nextView).catch(() => undefined);
            }}
          />
        }
      />
      {Dialog && !session.isReadOnly && <Dialog session={session} />}
    </>
  );
}
