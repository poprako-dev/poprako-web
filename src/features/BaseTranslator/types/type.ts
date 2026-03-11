import type { Unit } from "@/types/unit";

/** 字段级 patch 载荷：id 必须存在，其余字段为实际变更的字段 */
export type UnitPatch = { id: string } & Partial<Omit<Unit, "id">>;

export type UnitDiff = {
  /** 新增的完整或 Partial 单元（id 由前端生成） */
  insert: Partial<Unit>[];
  /** 仅包含变更字段的 patch 列表 */
  modify: UnitPatch[];
  /** 被删除的 unit id 列表 */
  delete: string[];
};
