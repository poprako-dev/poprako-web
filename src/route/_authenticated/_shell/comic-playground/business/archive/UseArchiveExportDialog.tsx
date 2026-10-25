import { useState, type ReactElement } from "react";
import type { ApiClient } from "@/api/client";
import { ArchiveExportDialog } from "./ArchiveExportDialog";
import { prepareArchiveExport } from "./archive-export";

export function useArchiveExportDialog(
  client: ApiClient,
  teamId: string | null,
  canExport: boolean,
): { open: (() => void) | undefined; dialog: ReactElement | null } {
  const [exportTeamId, setExportTeamId] = useState<string | null>(null);
  const enabled = canExport && teamId !== null;
  if (exportTeamId !== null && (!enabled || exportTeamId !== teamId)) setExportTeamId(null);
  return {
    open: enabled
      ? () => {
          setExportTeamId(teamId);
        }
      : undefined,
    dialog:
      enabled && exportTeamId === teamId ? (
        <ArchiveExportDialog
          key={teamId}
          onExport={(months, signal) => prepareArchiveExport(client, teamId, months, signal)}
          onClose={() => {
            setExportTeamId(null);
          }}
        />
      ) : null,
  };
}
