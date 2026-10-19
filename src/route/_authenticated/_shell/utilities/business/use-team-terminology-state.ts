import { useState, type Dispatch, type SetStateAction } from "react";
import type { TermbaseInfo } from "@/route/_authenticated/business/terminology/termbase";
import type { TermInfo } from "@/route/_authenticated/business/terminology/term";

export type TeamTermEditor =
  | { kind: "termbase"; termbase?: TermbaseInfo }
  | { kind: "term"; term?: TermInfo };

export type TermbaseSelection = {
  id: string;
  info?: TermbaseInfo;
  error?: string;
};

type Setter<T> = Dispatch<SetStateAction<T>>;
export type TeamTerminologyState = {
  level: "termbases" | "terms";
  setLevel: Setter<"termbases" | "terms">;
  selection: TermbaseSelection | undefined;
  setSelection: Setter<TermbaseSelection | undefined>;
  editor: TeamTermEditor | undefined;
  setEditor: Setter<TeamTermEditor | undefined>;
  baseQuery: string;
  setBaseQuery: Setter<string>;
  termQuery: string;
  setTermQuery: Setter<string>;
  baseRevision: number;
  setBaseRevision: Setter<number>;
  termRevision: number;
  setTermRevision: Setter<number>;
};

export function useTeamTerminologyState(): TeamTerminologyState {
  const [level, setLevel] = useState<"termbases" | "terms">("termbases");
  const [selection, setSelection] = useState<TermbaseSelection>();
  const [editor, setEditor] = useState<TeamTermEditor>();
  const [baseQuery, setBaseQuery] = useState("");
  const [termQuery, setTermQuery] = useState("");
  const [baseRevision, setBaseRevision] = useState(0);
  const [termRevision, setTermRevision] = useState(0);
  return {
    level,
    setLevel,
    selection,
    setSelection,
    editor,
    setEditor,
    baseQuery,
    setBaseQuery,
    termQuery,
    setTermQuery,
    baseRevision,
    setBaseRevision,
    termRevision,
    setTermRevision,
  };
}

export function openTeamTermbase(
  state: TeamTerminologyState,
  id: string,
  info?: TermbaseInfo,
): void {
  if (state.selection?.id !== id) state.setTermQuery("");
  state.setSelection(info ? { id, info } : { id });
  state.setLevel("terms");
}
