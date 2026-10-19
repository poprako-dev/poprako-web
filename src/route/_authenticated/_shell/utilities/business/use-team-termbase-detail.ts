import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TeamTerminologyDataSource } from "./team-terminology";
import type { TermbaseSelection } from "./use-team-terminology-state";

export function useTeamTermbaseDetail(
  dataSource: TeamTerminologyDataSource,
  teamId: string,
  selection: TermbaseSelection | undefined,
  setSelection: Dispatch<SetStateAction<TermbaseSelection | undefined>>,
): void {
  useEffect(() => {
    if (!selection || selection.info || selection.error) return;
    let active = true;
    const id = selection.id;
    async function load(): Promise<void> {
      try {
        const result = await dataSource.getTermbase(id);
        if (!active) return;
        if (result.success && result.data.teamId === teamId) {
          setSelection({ id, info: result.data });
        } else {
          setSelection({ id, error: result.success ? "术语库不可用" : result.error });
        }
      } catch (error) {
        console.error("[TeamTerminology] 加载术语库失败", { id, error });
        if (active) setSelection({ id, error: "加载术语库失败，请重试" });
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [dataSource, teamId, selection, setSelection]);
}
