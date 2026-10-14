import type { UnitInfo } from "../unit/unit";
import type { SaveUnits } from "../contract/type";
import type { DraftStore } from "./draft-store";

export type UnitSaveControllerOptions = {
  save: SaveUnits;
  reload: (pageId: string) => Promise<UnitInfo[]>;
  changed: (snapshot: SaveSnapshot) => void;
  failed: (error: unknown, phase: "save" | "refresh" | "local") => void;
  drafts?: DraftStore | undefined;
  canWrite?: () => boolean;
};

export type SaveSnapshot = {
  units: UnitInfo[];
  dirty: boolean;
  saving: boolean;
  error: string | null;
  refreshError: boolean;
  lastSavedAt: number | null;
  canUndo?: boolean;
  storageError?: string | null;
  pendingUnitIds?: string[];
};
export interface UnitSaveController {
  load: (id: string, units: UnitInfo[]) => void;
  commit: (units: UnitInfo[]) => void;
  undo: () => void;
  clearHistory: () => void;
  saveOnce: () => Promise<void>;
  flush: () => Promise<void>;
  refresh: () => Promise<void>;
  retryRecovery: () => Promise<void>;
  getSnapshot: () => SaveSnapshot;
  getPageId: () => string | undefined;
  setSuspended: (value: boolean) => void;
  setActive: (value: boolean) => void;
}
