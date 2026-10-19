import { Utilities } from "@/route/_authenticated/_shell/utilities/business/Utilities";
import { useMemo } from "react";
import { useApiClient } from "@/route/business/api-context";
import { useTeamSelection } from "@/route/business/session/use-active-team";
import {
  canManageTeamTerminology,
  createTeamTerminologyDataSource,
} from "./business/team-terminology";

function UtilitiesPage(): ReactElement {
  const client = useApiClient();
  const selection = useTeamSelection();
  const teamId = selection.status === "ready" ? selection.activeTeamId : undefined;
  const canEdit = selection.status === "ready" && canManageTeamTerminology(selection.activeMember);
  const terminology = useMemo(
    () =>
      teamId
        ? {
            teamId,
            canEdit,
            dataSource: createTeamTerminologyDataSource(client, teamId),
          }
        : undefined,
    [client, teamId, canEdit],
  );
  return <Utilities terminology={terminology} />;
}
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_shell/utilities/")({
  component: UtilitiesPage,
});
import type { ReactElement } from "react";
