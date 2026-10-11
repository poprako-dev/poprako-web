import { useEffect, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { TermbaseInfo } from "@/route/_authenticated/translator/business/terminology/termbase";
import type { TermInfo } from "@/route/_authenticated/translator/business/terminology/term";

export type LookupPanel = "closed" | "termbases" | "terms";
export type OpenLookupPanel = Exclude<LookupPanel, "closed">;
export type LookupEditorState =
  | { kind: "termbase"; termbase?: TermbaseInfo | undefined }
  | { kind: "term"; term?: TermInfo | undefined };

export type TerminologyLookupState = {
  panel: LookupPanel;
  setPanel: Dispatch<SetStateAction<LookupPanel>>;
  renderedPanel: OpenLookupPanel | undefined;
  setRenderedPanel: Dispatch<SetStateAction<OpenLookupPanel | undefined>>;
  selectedTermbase: TermbaseInfo | undefined;
  setSelectedTermbase: Dispatch<SetStateAction<TermbaseInfo | undefined>>;
  termbaseQuery: string;
  setTermbaseQuery: Dispatch<SetStateAction<string>>;
  sourceQuery: string;
  setSourceQuery: Dispatch<SetStateAction<string>>;
  termbaseRevision: number;
  setTermbaseRevision: Dispatch<SetStateAction<number>>;
  termRevision: number;
  setTermRevision: Dispatch<SetStateAction<number>>;
  editor: LookupEditorState | undefined;
  setEditor: Dispatch<SetStateAction<LookupEditorState | undefined>>;
  rootRef: RefObject<HTMLDivElement | null>;
};

function usePanelCloseAnimation(state: TerminologyLookupState): void {
  const { panel, renderedPanel, setRenderedPanel } = state;
  useEffect(() => {
    if (panel !== "closed" || !renderedPanel) return;
    const timeoutId = globalThis.setTimeout(() => {
      setRenderedPanel(undefined);
    }, 150);
    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [panel, renderedPanel, setRenderedPanel]);
}

function useOutsidePanelDismissal(state: TerminologyLookupState): void {
  const { rootRef, setPanel } = state;
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent): void => {
      if (event.target instanceof Element && event.target.closest("[data-app-dialog]")) return;
      if (!rootRef.current?.contains(event.target as Node)) setPanel("closed");
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [rootRef, setPanel]);
}

export function useTerminologyLookupState(): TerminologyLookupState {
  const [panel, setPanel] = useState<LookupPanel>("closed");
  const [renderedPanel, setRenderedPanel] = useState<OpenLookupPanel>();
  const [selectedTermbase, setSelectedTermbase] = useState<TermbaseInfo>();
  const [termbaseQuery, setTermbaseQuery] = useState("");
  const [sourceQuery, setSourceQuery] = useState("");
  const [termbaseRevision, setTermbaseRevision] = useState(0);
  const [termRevision, setTermRevision] = useState(0);
  const [editor, setEditor] = useState<LookupEditorState>();
  const rootRef = useRef<HTMLDivElement>(null);
  const state = {
    panel,
    setPanel,
    renderedPanel,
    setRenderedPanel,
    selectedTermbase,
    setSelectedTermbase,
    termbaseQuery,
    setTermbaseQuery,
    sourceQuery,
    setSourceQuery,
    termbaseRevision,
    setTermbaseRevision,
    termRevision,
    setTermRevision,
    editor,
    setEditor,
    rootRef,
  };
  usePanelCloseAnimation(state);
  useOutsidePanelDismissal(state);
  return state;
}
