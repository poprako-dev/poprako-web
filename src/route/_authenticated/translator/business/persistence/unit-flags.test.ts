import type { SaveUnits } from "../contract/type";
import type { Mock } from "vitest";
import type { UnitInfo } from "@/route/_authenticated/translator/business/unit/unit";
import type { SaveSnapshot } from "@/route/_authenticated/translator/business/persistence/unit-save-controller";
import { describe, expect, test, vi } from "vitest";
import { createUnit } from "@/route/_authenticated/translator/business/unit/unit";
import { isUnitSame } from "@/route/_authenticated/translator/business/unit/unit-comparison";
import { applyUnitUpdates } from "@/route/_authenticated/translator/business/unit/unit-edit";
import { createUnitPatch } from "@/route/_authenticated/translator/business/unit/unit-patch";
import { createUnitSaveFixture } from "@/route/_authenticated/translator/business/test/unit-save-fixture";
import { buildUnitDiff } from "@/route/_authenticated/translator/business/persistence/unit-diff";
import { createUnitSaveController } from "@/route/_authenticated/translator/business/persistence/unit-save-controller";
import { mergeSavedUnits } from "@/route/_authenticated/translator/business/persistence/unit-save-merge";

function fixture(): {
  id: string;
  translatedText: string;
  proofreadText: string;
  isProofread: boolean;
  translatorId: string;
  proofreaderId: string;
  xCoord: number;
  yCoord: number;
  index: number;
  isBubble: boolean;
  isFlagged: boolean;
  translatorCommnet?: string | undefined;
  proofreaderComment?: string | undefined;
} {
  return {
    ...createUnit(0.2, 0.3, true),
    id: "unit",
    translatedText: "translation",
    proofreadText: "revision",
    isProofread: true,
    translatorId: "translator",
    proofreaderId: "proofreader",
  };
}

function setup(): {
  original: {
    id: string;
    translatedText: string;
    proofreadText: string;
    isProofread: boolean;
    translatorId: string;
    proofreaderId: string;
    xCoord: number;
    yCoord: number;
    index: number;
    isBubble: boolean;
    isFlagged: boolean;
    translatorCommnet?: string | undefined;
    proofreaderComment?: string | undefined;
  };
  pages: Map<
    string,
    {
      id: string;
      translatedText: string;
      proofreadText: string;
      isProofread: boolean;
      translatorId: string;
      proofreaderId: string;
      xCoord: number;
      yCoord: number;
      index: number;
      isBubble: boolean;
      isFlagged: boolean;
      translatorCommnet?: string | undefined;
      proofreaderComment?: string | undefined;
    }[]
  >;
  backend: SaveUnits;
  save: Mock<SaveUnits>;
  controller: {
    load: (id: string, units: UnitInfo[]) => void;
    commit: (units: UnitInfo[]) => void;
    saveOnce: () => Promise<void>;
    flush: () => Promise<void>;
    refresh: () => Promise<void>;
    getSnapshot: () => SaveSnapshot;
    setSuspended: (shouldSuspend: boolean) => void;
    setActive: (shouldActivate: boolean) => void;
  };
} {
  const original = fixture();
  const pages = new Map([["page", [original]]]);
  const backend = createUnitSaveFixture(pages);
  const save = vi.fn(backend);
  const controller = createUnitSaveController({
    save,
    reload: (id) => Promise.resolve(pages.get(id) ?? []),
    changed: vi.fn(),
    failed: vi.fn(),
  });
  controller.load("page", [original]);
  return { original, pages, backend, save, controller };
}

describe("unit flags", () => {
  test("defaults to false, updates independently, and reads the API value", () => {
    const original = fixture();
    expect(original.isFlagged).toBe(false);
    const flagged = applyUnitUpdates(original, { isFlagged: true });
    expect(flagged).toEqual({ ...original, isFlagged: true });
    expect(isUnitSame(original, flagged)).toBe(false);
    expect(createUnitPatch(flagged, original)).toEqual({
      id: "unit",
      isFlagged: true,
    });
    expect(applyUnitUpdates(flagged, { translatedText: "changed" }).isFlagged).toBe(true);
    expect(applyUnitUpdates(flagged, { isFlagged: false })).toEqual(original);
  });

  test("serializes flag-only patches and explicit false, with no false dirty state", () => {
    const original = fixture();
    const flagged = { ...original, isFlagged: true };
    const flaggedPatch = buildUnitDiff([flagged], [original]).ops[0];
    const clearedPatch = buildUnitDiff([original], [flagged]).ops[0];
    expect(flaggedPatch).toEqual({
      edit: "patch",
      id: "unit",
      nextId: { type: "skip" },
      isFlagged: true,
      translation: { type: "skip" },
      revision: { type: "skip" },
    });
    expect(clearedPatch).toMatchObject({ edit: "patch", id: "unit", isFlagged: false });
    expect(buildUnitDiff([original], [original]).ops).toEqual([]);
    expect(buildUnitDiff([flagged], []).ops[0]).toMatchObject({
      edit: "create",
      isFlagged: true,
    });
  });

  test("merges draft flags with unrelated remote edits", () => {
    const base = fixture();
    const local = { ...base, isFlagged: true };
    const remote = { ...base, translatedText: "remote text" };
    expect(mergeSavedUnits([base], [local], [remote])[0]).toMatchObject({
      isFlagged: true,
      translatedText: "remote text",
    });
    expect(mergeSavedUnits([base], [base], [{ ...remote, isFlagged: true }])[0]?.isFlagged).toBe(
      true,
    );
  });

  test("retains edits after failure and retries with the original save identity", async () => {
    const { controller, original, save, pages } = setup();
    save.mockRejectedValueOnce(new Error("offline"));
    controller.commit([{ ...original, isFlagged: true }]);
    await expect(controller.flush()).rejects.toThrow("offline");
    expect(controller.getSnapshot()).toMatchObject({ dirty: true });
    expect(controller.getSnapshot().units[0]?.isFlagged).toBe(true);
    await controller.flush();
    expect(save.mock.calls[0]).toEqual(save.mock.calls[1]);
    expect(controller.getSnapshot().dirty).toBe(false);
    expect(pages.get("page")?.[0]).toEqual({ ...original, isFlagged: true });
  });

  test("flush drains changes made while a flag save is in flight", async () => {
    const { controller, original, save, backend, pages } = setup();
    save.mockImplementationOnce((...args) => {
      controller.commit([original]);
      return backend(...args);
    });
    controller.commit([{ ...original, isFlagged: true }]);
    await controller.flush();
    expect(save).toHaveBeenCalledTimes(2);
    expect(pages.get("page")?.[0]?.isFlagged).toBe(false);
    expect(controller.getSnapshot().dirty).toBe(false);
  });

  test("new flagged units keep their flag when permanent IDs are acknowledged", async () => {
    const { controller, pages, save } = setup();
    const local = { ...createUnit(0, 0, true), isFlagged: true };
    controller.commit([local]);
    await controller.flush();
    const permanent = pages.get("page")?.[0]?.id;
    expect(permanent).not.toBe(local.id);
    expect(controller.getSnapshot().units[0]?.isFlagged).toBe(true);
    controller.commit([{ ...local, isFlagged: false }]);
    await controller.flush();
    expect(save.mock.calls.at(-1)?.[1].ops[0]).toMatchObject({
      edit: "patch",
      id: permanent,
      isFlagged: false,
    });
  });
});
