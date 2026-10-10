import type { SaveSnapshot } from "@/route/_authenticated/translator/business/persistence/unit-save-controller";
import type { SaveUnits } from "../contract/type";
import type { Mock } from "vitest";
import { describe, expect, test, vi } from "vitest";
import { ApiRequestError } from "@/route/business/request-error";
import type { UnitInfo } from "@/route/_authenticated/translator/business/unit/unit";
import { createUnitSaveFixture } from "@/route/_authenticated/translator/business/test/unit-save-fixture";
import { createUnitSaveController } from "@/route/_authenticated/translator/business/persistence/unit-save-controller";
import { UnitSaveProtocolError } from "@/route/_authenticated/translator/business/persistence/unit-save-merge";

function unit(id = "existing", text = "before"): UnitInfo {
  return {
    id,
    index: 0,
    xCoord: 0.1,
    yCoord: 0.2,
    isBubble: true,
    isFlagged: false,
    isProofread: false,
    translatedText: text,
  };
}
function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return {
    promise,
    resolve: () => {
      resolve();
    },
  };
}
function setup(initial = [unit()]): {
  controller: {
    load: (id: string, units: UnitInfo[]) => void;
    commit: (units: UnitInfo[]) => void;
    saveOnce: () => Promise<void>;
    flush: () => Promise<void>;
    refresh: () => Promise<void>;
    getPageId: () => string | undefined;
    getSnapshot: () => SaveSnapshot;
    setSuspended: (shouldSuspend: boolean) => void;
    setActive: (shouldActivate: boolean) => void;
  };
  pages: Map<string, UnitInfo[]>;
  backend: SaveUnits;
  save: Mock<SaveUnits>;
  reload: Mock<(pageId: string) => Promise<UnitInfo[]>>;
  changed: Mock<(snapshot: SaveSnapshot) => void>;
  failed: Mock<(error: unknown, phase: "save" | "refresh" | "local") => void>;
} {
  const pages = new Map([["p1", initial]]);
  const backend = createUnitSaveFixture(pages);
  const save = vi.fn(backend);
  const reload = vi.fn((pageId: string) => Promise.resolve(pages.get(pageId) ?? []));
  const changed = vi.fn();
  const failed = vi.fn();
  const controller = createUnitSaveController({
    save,
    reload,
    changed,
    failed,
  });
  controller.load("p1", initial);
  return { controller, pages, backend, save, reload, changed, failed };
}

describe("Unit save coordination", () => {
  test("controller methods keep their receiver when passed as callbacks", async () => {
    const { controller } = setup();
    const { load, commit, refresh } = controller;
    load("p2", [unit("p2-unit")]);
    await refresh();
    commit([unit("p2-unit", "edited")]);
    expect(controller.getPageId()).toBe("p2");
    expect(controller.getSnapshot().units[0]?.translatedText).toBe("edited");
  });

  test("confirmed requests accept the current server result without compensating writes", async () => {
    const { controller, reload } = setup();
    reload.mockResolvedValueOnce([unit()]);
    controller.commit([
      { ...unit("existing", "saved translation"), proofreadText: "saved revision" },
    ]);
    await controller.saveOnce();
    expect(controller.getSnapshot().units[0]).toMatchObject({
      translatedText: "before",
    });
    expect(controller.getSnapshot().refreshError).toBe(false);
  });
});

describe("Unit save coordination", () => {
  test("unmount before dispatch prevents network work and preserves the pending save", async () => {
    const { controller, save, reload } = setup();
    controller.commit([unit("existing", "edited")]);
    const pending = controller.saveOnce();
    controller.setActive(false);
    await pending;
    expect(save).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    controller.setActive(true);
    await controller.flush();
    expect(save).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot().dirty).toBe(false);
  });
});

describe("Unit save coordination", () => {
  test("clean pages do no network work", async () => {
    const { controller, save, reload } = setup();
    await controller.saveOnce();
    await controller.flush();
    expect(save).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });
});

describe("Unit save coordination", () => {
  test("dependent batches complete in order before the final refresh", async () => {
    const initial = Array.from({ length: 100 }, (_, index) => ({
      ...unit(`old-${String(index)}`),
      index,
    }));
    const { controller, save, reload, pages } = setup(initial);
    const wait = deferred();
    reload.mockImplementationOnce(async () => {
      await wait.promise;
      return pages.get("p1") ?? [];
    });
    controller.commit(initial.map((item, index) => ({ ...item, id: `new-${String(index)}` })));
    const saving = controller.saveOnce();
    await vi.waitFor(() => {
      expect(reload).toHaveBeenCalledWith("p1");
    });
    expect(save).toHaveBeenCalledTimes(2);
    expect(controller.getSnapshot().saving).toBe(true);
    wait.resolve();
    await saving;
    expect(save).toHaveBeenCalledTimes(2);
    expect(reload.mock.calls).toEqual([["p1"]]);
    expect(save.mock.invocationCallOrder[1]).toBeLessThan(reload.mock.invocationCallOrder[0] ?? 0);
    expect(controller.getSnapshot().dirty).toBe(false);
  });
});

describe("Unit save coordination", () => {
  test("a failed final refresh never resends either completed batch", async () => {
    const initial = Array.from({ length: 100 }, (_, index) => ({
      ...unit(`old-${String(index)}`),
      index,
    }));
    const { controller, save, reload, failed, pages } = setup(initial);
    reload.mockRejectedValueOnce(new Error("read failed"));
    controller.commit(initial.map((item, index) => ({ ...item, id: `new-${String(index)}` })));
    await controller.saveOnce();
    expect(save).toHaveBeenCalledTimes(2);
    expect(pages.get("p1")).toHaveLength(100);
    expect(controller.getSnapshot()).toMatchObject({ dirty: false, refreshError: true });
    expect(failed).toHaveBeenCalledWith(expect.any(Error), "refresh");
    await controller.flush();
    expect(save).toHaveBeenCalledTimes(2);
    expect(reload).toHaveBeenCalledTimes(2);
    expect(save.mock.calls.map((call) => call[1].ops[0]?.edit)).toEqual(["delete", "create"]);
    expect(pages.get("p1")).toHaveLength(100);
    expect(controller.getSnapshot()).toMatchObject({ dirty: false, refreshError: false });
  });
});

describe("Unit save coordination", () => {
  test("keeps edits made while the save is pending for the next cycle", async () => {
    const { controller, save, backend } = setup();
    const wait = deferred();
    save.mockImplementationOnce(async (...args) => {
      await wait.promise;
      return backend(...args);
    });
    controller.commit([unit("existing", "snapshot")]);
    const first = controller.saveOnce();
    controller.commit([unit("existing", "new typing")]);
    wait.resolve();
    await first;
    expect(controller.getSnapshot().units[0]?.translatedText).toBe("new typing");
    expect(controller.getSnapshot().dirty).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    await controller.saveOnce();
    expect(controller.getSnapshot().dirty).toBe(false);
  });
});

describe("Unit save coordination", () => {
  test("manual flush joins auto save and drains subsequent edits once", async () => {
    const { controller, save, backend, pages } = setup();
    const wait = deferred();
    save.mockImplementationOnce(async (...args) => {
      await wait.promise;
      return backend(...args);
    });
    controller.commit([unit("existing", "first")]);
    const auto = controller.saveOnce();
    expect(controller.saveOnce()).toBe(auto);
    controller.commit([unit("existing", "second")]);
    const manual = controller.flush();
    const duplicate = controller.flush();
    wait.resolve();
    await Promise.all([auto, manual, duplicate]);
    expect(save).toHaveBeenCalledTimes(2);
    expect(pages.get("p1")?.[0]?.translatedText).toBe("second");
    expect(controller.getSnapshot().dirty).toBe(false);
  });
});

describe("Unit save coordination", () => {
  test("new units keep their editor identity and use permanent IDs for later edits", async () => {
    const { controller, save, backend, pages } = setup([]);
    const wait = deferred();
    save.mockImplementationOnce(async (...args) => {
      await wait.promise;
      return backend(...args);
    });
    controller.commit([unit("local", "first")]);
    const auto = controller.saveOnce();
    controller.commit([unit("local", "second")]);
    wait.resolve();
    await auto;
    const permanent = pages.get("p1")?.[0]?.id;
    expect(permanent).not.toBe("local");
    expect(controller.getSnapshot().units[0]?.id).toBe("local");
    expect(controller.getSnapshot().units[0]?.translatedText).toBe("second");
    await controller.flush();
    expect(save.mock.calls[1]?.[1].ops[0]).toMatchObject({
      edit: "patch",
      id: permanent,
    });
    expect(pages.get("p1")).toHaveLength(1);
  });
});

describe("Unit save coordination", () => {
  test("deleting an in-flight creation deletes its acknowledged permanent ID", async () => {
    const { controller, save, backend, pages } = setup([]);
    const wait = deferred();
    save.mockImplementationOnce(async (...args) => {
      await wait.promise;
      return backend(...args);
    });
    controller.commit([unit("local")]);
    const auto = controller.saveOnce();
    controller.commit([]);
    wait.resolve();
    await auto;
    expect(controller.getSnapshot().units).toEqual([]);
    await controller.flush();
    expect(save.mock.calls[1]?.[1].ops[0]?.edit).toBe("delete");
    expect(pages.get("p1")).toEqual([]);
  });
});

describe("Unit save coordination", () => {
  test("a lost successful response reuses the identical save ID and payload", async () => {
    const { controller, save, backend, pages } = setup([]);
    save.mockImplementationOnce(async (...args) => {
      await backend(...args);
      throw new Error("connection lost after commit");
    });
    controller.commit([unit("local", "first")]);
    await expect(controller.saveOnce()).rejects.toThrow("connection lost");
    controller.commit([unit("local", "second")]);
    await controller.flush();
    expect(save.mock.calls[1]).toEqual(save.mock.calls[0]);
    expect(save.mock.calls[2]?.[2]).not.toBe(save.mock.calls[0]?.[2]);
    expect(pages.get("p1")).toHaveLength(1);
    expect(pages.get("p1")?.[0]?.translatedText).toBe("second");
  });
});

describe("Unit save coordination", () => {
  test("reload failure never resends an acknowledged batch", async () => {
    const { controller, save, reload } = setup();
    reload.mockRejectedValueOnce(new Error("read failed"));
    controller.commit([unit("existing", "saved")]);
    await controller.saveOnce();
    expect(controller.getSnapshot()).toMatchObject({
      dirty: false,
      refreshError: true,
    });
    expect(controller.getSnapshot().units[0]?.translatedText).toBe("saved");
    await controller.saveOnce();
    expect(save).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(2);
    expect(controller.getSnapshot().refreshError).toBe(false);
  });
});

describe("Unit save coordination", () => {
  test("late save and read responses cannot overwrite another page", async () => {
    const { controller, save, backend } = setup();
    const wait = deferred();
    save.mockImplementationOnce(async (...args) => {
      await wait.promise;
      return backend(...args);
    });
    controller.commit([unit("existing", "p1 edited")]);
    const auto = controller.saveOnce();
    await Promise.resolve();
    controller.load("p2", [unit("p2", "other page")]);
    wait.resolve();
    await auto;
    expect(controller.getSnapshot().units[0]?.id).toBe("p2");
    expect(controller.getSnapshot().saving).toBe(false);
  });
});

describe("Unit save coordination", () => {
  test("protocol errors retain the identical batch for retries", async () => {
    const { controller, save } = setup([]);
    save.mockResolvedValue({ createdUnitIds: [] });
    controller.commit([unit("local")]);
    await expect(controller.saveOnce()).rejects.toBeInstanceOf(UnitSaveProtocolError);
    await expect(controller.saveOnce()).rejects.toBeInstanceOf(UnitSaveProtocolError);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1]).toEqual(save.mock.calls[0]);
    expect(controller.getSnapshot().dirty).toBe(true);
  });
});

describe("Unit save coordination", () => {
  test("a rejected immutable batch retains its save ID before subsequent edits", async () => {
    const { controller, save } = setup();
    save.mockRejectedValueOnce(
      new ApiRequestError({
        success: false,
        error: "invalid",
        httpStatus: 422,
      }),
    );
    controller.commit([unit("existing", "bad")]);
    await expect(controller.saveOnce()).rejects.toThrow("invalid");
    controller.commit([unit("existing", "corrected")]);
    await controller.flush();
    expect(save.mock.calls[1]).toEqual(save.mock.calls[0]);
    expect(save.mock.calls[2]?.[2]).not.toBe(save.mock.calls[0]?.[2]);
    expect(controller.getSnapshot().dirty).toBe(false);
  });
});

describe("Unit save coordination", () => {
  test("a 200-op replacement acknowledges deletes before retrying creates", async () => {
    const initial = Array.from({ length: 100 }, (_, index) => ({
      ...unit(`old-${String(index)}`),
      index,
    }));
    const { controller, save, backend, pages } = setup(initial);
    save.mockImplementationOnce(backend).mockRejectedValueOnce(new Error("offline"));
    controller.commit(initial.map((item, index) => ({ ...item, id: `new-${String(index)}` })));
    await expect(controller.saveOnce()).rejects.toThrow("offline");
    expect(pages.get("p1")).toHaveLength(0);
    await controller.flush();
    expect(save.mock.calls.map((call) => call[1].ops.length)).toEqual([100, 100, 100]);
    expect(save.mock.calls[2]).toEqual(save.mock.calls[1]);
    expect(pages.get("p1")).toHaveLength(100);
  });
});

describe("Unit save coordination", () => {
  test("local clearing, independent proofreading and order survive a delayed reload", async () => {
    const initial = [unit("a"), { ...unit("b"), index: 1 }];
    const { controller, reload, pages } = setup(initial);
    const wait = deferred();
    reload.mockImplementationOnce(async () => {
      await wait.promise;
      return pages.get("p1") ?? [];
    });
    controller.commit([unit("a", "submitted"), initial[1] ?? unit("b")]);
    const auto = controller.saveOnce();
    await vi.waitFor(() => {
      expect(reload).toHaveBeenCalledTimes(1);
    });
    controller.commit([
      { ...unit("b"), isProofread: true, proofreadText: "revision" },
      { ...unit("a"), index: 1, translatedText: undefined },
    ]);
    wait.resolve();
    await auto;
    expect(controller.getSnapshot().units.map((item) => item.id)).toEqual(["b", "a"]);
    expect(controller.getSnapshot().units[0]).toMatchObject({
      isProofread: true,
      proofreadText: "revision",
    });
    expect(controller.getSnapshot().units[1]?.translatedText).toBeUndefined();
    await controller.flush();
    expect(controller.getSnapshot().dirty).toBe(false);
  });
});
