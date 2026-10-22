import { useImperativeHandle, type ReactElement, type Ref } from "react";
import { useModuleResource } from "@/shared/hook/use-module-resource";
import type { TeamTerminologyHandle } from "./TeamTerminologyTool";
import type { TeamTerminology } from "./team-terminology";
import { teamTerminologyModule } from "./utility-modules";
import { UtilityModuleFeedback } from "./UtilityModuleFeedback";
import { useTerminologyImportBridge } from "./use-terminology-import-bridge";

type Props = {
  terminology: TeamTerminology;
  visited: boolean;
  active: boolean;
  onActivate: () => void;
  ref?: Ref<TeamTerminologyHandle>;
};

export function AsyncTeamTerminologyTool({
  terminology,
  visited,
  active,
  onActivate,
  ref,
}: Props): ReactElement | null {
  const { requested, attach, importFile } = useTerminologyImportBridge(onActivate);
  useImperativeHandle(ref, () => ({ importFile }), [importFile]);
  const enabled = visited || requested;
  const snapshot = useModuleResource(teamTerminologyModule, enabled);
  if (!enabled) return null;
  if (snapshot.status === "ready") {
    const { TeamTerminologyTool } = snapshot.module;
    return (
      <TeamTerminologyTool
        ref={attach}
        terminology={terminology}
        active={active}
        onActivate={onActivate}
      />
    );
  }
  return <UtilityModuleFeedback failed={snapshot.status === "error"} />;
}
