import { createUnitSaveController, type UnitSaveController } from "./unit-save-controller";
import type { DraftStore } from "./draft-store";
import type { SaveUnits } from "../contract/type";
import type { UnitInfo } from "../unit/unit";
export async function syncChapterDrafts(args: {
  current: UnitSaveController;
  drafts?: DraftStore | undefined;
  save: SaveUnits;
  reload: (pageId: string) => Promise<UnitInfo[]>;
  canWrite: () => boolean;
  failed: (error: unknown, phase: "save" | "refresh" | "local") => void;
}): Promise<void> {
  await args.drafts?.ready;
  const ids = Object.keys(args.drafts?.getState().drafts ?? {});
  await args.current.flush();
  for (const id of ids) {
    if (id === args.current.getPageId()) continue;
    const controller = createUnitSaveController({
      ...args,
      changed: () => {
        /* The draft store publishes background page changes. */
      },
    });
    controller.load(id, args.drafts?.getState().drafts[id]?.units ?? (await args.reload(id)));
    try {
      await controller.flush();
    } finally {
      controller.setActive(false);
    }
  }
  await args.current.flush();
}
