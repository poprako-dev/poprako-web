import { afterEach, describe, expect, test, vi } from "vitest";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";

describe("notification toast store", () => {
  afterEach(() => {
    useToastStore.getState().hideToast();
    vi.unstubAllGlobals();
  });

  test("refreshes repeated notifications with the same message and type", () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });

    useToastStore.getState().showToast("保存成功", "success");
    frames.shift()?.(0);
    const firstToast = useToastStore.getState().toast;

    useToastStore.getState().showToast("保存成功", "success");
    expect(useToastStore.getState().toast).toBeNull();
    frames.shift()?.(16);

    expect(useToastStore.getState().toast).toEqual({
      message: "保存成功",
      type: "success",
    });
    expect(useToastStore.getState().toast).not.toBe(firstToast);
  });
});
