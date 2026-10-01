import type { UnitInfo } from "../unit/unit";
export type SaveSnapshot = {
  units: UnitInfo[];
  dirty: boolean;
  saving: boolean;
  error: string | null;
  refreshError: boolean;
  lastSavedAt: number | null;
  storageError?: string | null;
  pendingUnitIds?: string[];
};
export interface UnitSaveController {
  load: (id: string, units: UnitInfo[]) => void;
  commit: (units: UnitInfo[]) => void;
  saveOnce: () => Promise<void>;
  flush: () => Promise<void>;
  refresh: () => Promise<void>;
  retryRecovery: () => Promise<void>;
  getSnapshot: () => SaveSnapshot;
  getPageId: () => string | undefined;
  setSuspended: (value: boolean) => void;
  setActive: (value: boolean) => void;
}
