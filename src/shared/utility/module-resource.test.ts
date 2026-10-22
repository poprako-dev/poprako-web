import { expect, test, vi } from "vitest";
import { deferred } from "@/test-resource/deferred";
import { createModuleResource } from "./module-resource";

test("intent and mounted consumers share the pending import and successful module", async () => {
  const pending = deferred<{ name: string }>();
  const loader = vi.fn(() => pending.promise);
  const resource = createModuleResource(loader);
  const first = resource.load();
  const second = resource.load();
  expect(first).toBe(second);
  expect(resource.getSnapshot()).toEqual({ status: "loading" });
  const module = { name: "editor" };
  pending.resolve(module);
  expect(await first).toBe(module);
  expect(await resource.load()).toBe(module);
  expect(loader).toHaveBeenCalledOnce();
  expect(resource.getSnapshot()).toEqual({ status: "ready", module });
});

test("a failed import remains an error until explicitly retried", async () => {
  const failure = new Error("offline");
  const module = { name: "detail" };
  const loader = vi
    .fn<() => Promise<typeof module>>()
    .mockRejectedValueOnce(failure)
    .mockResolvedValueOnce(module);
  const resource = createModuleResource(loader);
  await expect(resource.load()).rejects.toBe(failure);
  expect(resource.getSnapshot()).toEqual({ status: "error", error: failure });
  expect(loader).toHaveBeenCalledOnce();
  expect(await resource.load()).toBe(module);
  expect(loader).toHaveBeenCalledTimes(2);
});

test("synchronous loader failures are retryable and removed listeners are not notified", async () => {
  const failure = new Error("initialization failed");
  const loader = vi
    .fn<() => Promise<string>>()
    .mockImplementationOnce(() => {
      throw failure;
    })
    .mockResolvedValueOnce("ready");
  const resource = createModuleResource(loader);
  const listener = vi.fn();
  const unsubscribe = resource.subscribe(listener);
  await expect(resource.load()).rejects.toBe(failure);
  expect(listener).toHaveBeenCalledTimes(2);
  unsubscribe();
  await expect(resource.load()).resolves.toBe("ready");
  expect(listener).toHaveBeenCalledTimes(2);
});
