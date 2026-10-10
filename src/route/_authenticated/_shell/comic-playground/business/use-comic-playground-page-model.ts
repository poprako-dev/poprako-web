import { useState } from "react";
import { useTeamSelection } from "@/route/business/session/use-active-team";
import { useApiClient } from "@/route/business/api-context";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { hasRole } from "@/route/business/identity/role";
import { useComicPlaygroundFilters } from "@/route/_authenticated/_shell/comic-playground/business/use-comic-playground-filters";
import { useComicPlaygroundWorksets } from "@/route/_authenticated/_shell/comic-playground/business/use-comic-playground-worksets";
import type { MemberInfo } from "@/route/business/identity/member";

export function useComicPlaygroundPageModel(): {
  client: ReturnType<typeof useApiClient>;
  teamId: string | null;
  activeMember: MemberInfo | null;
  showToast: ReturnType<typeof useToastStore.getState>["showToast"];
  isAdmin: boolean;
  filters: ReturnType<typeof useComicPlaygroundFilters>;
  worksets: ReturnType<typeof useComicPlaygroundWorksets>;
  comicListRefreshKey: number;
  setComicListRefreshKey: (value: number | ((current: number) => number)) => void;
  comicCreatorTeamId: string | null;
  setComicCreatorTeamId: (value: string | null) => void;
  showWorksetCreatorModal: boolean;
  setShowWorksetCreatorModal: (value: boolean | ((current: boolean) => boolean)) => void;
} {
  const client = useApiClient();
  const teamSelection = useTeamSelection();
  const teamId = teamSelection.status === "ready" ? teamSelection.activeTeamId : null;
  const activeMember = teamSelection.status === "ready" ? teamSelection.activeMember : null;
  const showToast = useToastStore((state) => state.showToast);
  const [comicListRefreshKey, setComicListRefreshKey] = useState(0);
  const [comicCreatorTeamId, setComicCreatorTeamId] = useState<string | null>(null);
  const [showWorksetCreatorModal, setShowWorksetCreatorModal] = useState(false);
  const filters = useComicPlaygroundFilters();
  const worksets = useComicPlaygroundWorksets({ teamId, showToast });
  const isAdmin = activeMember !== null && hasRole(activeMember, "admin");

  return {
    client,
    teamId,
    activeMember,
    showToast,
    isAdmin,
    filters,
    worksets,
    comicListRefreshKey,
    setComicListRefreshKey,
    comicCreatorTeamId,
    setComicCreatorTeamId,
    showWorksetCreatorModal,
    setShowWorksetCreatorModal,
  };
}
