import type { RefObject } from "react";
import type { UnitInfo } from "../unit/unit";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { SaveUnits } from "../contract/type";
import type { SaveSnapshot } from "./unit-save-controller";
import type { DraftStore } from "./draft-store";

export type UnitPersistenceArgs = {
  onSaveUnits: SaveUnits;
  onReloadUnits: (pageId: string) => Promise<UnitInfo[]>;
  onExit: () => void;
  showToast: (message: string, type: ToastType) => void;
  loadPage: (index: number, targetUnitId?: string) => Promise<void>;
  setUnitBuf: (units: UnitInfo[]) => void;
  autoSaveEnabled: boolean;
  drafts?: DraftStore | undefined;
  canWrite?: boolean | undefined;
  registerLeaveGuard?: ((guard: (() => Promise<boolean>) | null) => void) | undefined;
};

export type UnitPersistenceResult = {
  unitBufRef: RefObject<UnitInfo[]>;
  saving: boolean;
  saveState: SaveSnapshot;
  commitUnits: (units: UnitInfo[]) => void;
  setLoadedUnits: (pageId: string, units: UnitInfo[]) => void;
  flushIfDirty: (showSuccess?: boolean) => Promise<void>;
  handleNavigate: (index: number, targetUnitId?: string) => Promise<void>;
  handleExit: () => Promise<void>;
  runExclusive: (operation: () => Promise<void>) => Promise<void>;
  refreshUnits: () => Promise<void>;
  retryRecovery: () => Promise<void>;
};
