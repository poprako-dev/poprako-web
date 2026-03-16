import type { UnitCreation, UnitPatch } from "@/types/unit";

export type { UnitCreation, UnitPatch } from "@/types/unit";

export type UnitDiff = {
  /** 新增的完整单元（id 由前端生成） */
  insert: UnitCreation[];
  /** 仅包含变更字段的 patch 列表 */
  patch: UnitPatch[];
  /** 被删除的 unit id 列表 */
  delete: string[];
};
