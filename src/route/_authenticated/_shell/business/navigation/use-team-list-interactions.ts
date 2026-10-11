import { useCallback, useRef } from "react";
import type { TeamConfig } from "@/route/_authenticated/_shell/business/navigation/app-sidebar-type";

function createContextMenuHandler(): (event: React.MouseEvent) => void {
  return (event) => {
    event.preventDefault();
  };
}

export function useTeamListInteractions(
  onSelect: (team: TeamConfig) => void,
  onLongPressTeam?: (team: TeamConfig) => void,
): {
  handlePointerDown: (team: TeamConfig) => (event: React.PointerEvent) => void;
  handlePointerUp: () => (event: React.PointerEvent) => void;
  handlePointerCancel: () => () => void;
  handleContextMenu: () => (event: React.MouseEvent) => void;
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamRef = useRef<TeamConfig | null>(null);
  const longPressHandledRef = useRef(false);

  const clearLongPress = useCallback(() => {
    if (!timerRef.current) {
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const handlePointerDown = useCallback(
    (team: TeamConfig) => (event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      longPressHandledRef.current = false;
      teamRef.current = team;
      timerRef.current = setTimeout(() => {
        longPressHandledRef.current = true;
        onLongPressTeam?.(team);
      }, 500);
    },
    [onLongPressTeam],
  );
  const handlePointerUp = useCallback(
    () => (event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      clearLongPress();
      if (!longPressHandledRef.current && teamRef.current) {
        onSelect(teamRef.current);
      }
    },
    [clearLongPress, onSelect],
  );
  const handlePointerCancel = useCallback(() => clearLongPress, [clearLongPress]);
  const handleContextMenu = useCallback(() => createContextMenuHandler(), []);

  return { handlePointerDown, handlePointerUp, handlePointerCancel, handleContextMenu };
}
