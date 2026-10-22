import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { ModuleResource } from "@/shared/utility/module-resource";
import { createModuleResource } from "@/shared/utility/module-resource";
import type { TranslatorModeModule } from "./mode-props";
import { BaseTranslator } from "../BaseTranslator";
import { createStoryArgs } from "../test/base-translator-story-fixture";
import { undoUnit } from "../test/unit-undo-fixture";

const refresh = vi.hoisted(() => vi.fn());
vi.mock("@/shared/utility/reload-page", () => ({ reloadPage: refresh }));

const modules = vi.hoisted(
  (): {
    editing: ModuleResource<TranslatorModeModule> | null;
    readOnly: ModuleResource<TranslatorModeModule> | null;
    resolve: () => void;
  } => ({ editing: null, readOnly: null, resolve: () => undefined }),
);

vi.mock("./translator-mode-module", () => ({
  translatorModeModule: (mode: string) =>
    mode === "readOnly" ? modules.readOnly : modules.editing,
  preloadTranslatorMode: (mode: string) =>
    (mode === "readOnly" ? modules.readOnly : modules.editing)?.load(),
}));

beforeEach(() => {
  refresh.mockClear();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe(): void {
        /* Geometry is controlled directly in this DOM test. */
      }
      disconnect(): void {
        /* No observer resources are allocated. */
      }
    },
  );
  vi.stubGlobal("CSS", { escape: (value: string) => value });
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
  const ready = new Promise<void>((resolve) => {
    modules.resolve = resolve;
  });
  modules.editing = createModuleResource(() => import("./editing-mode"));
  modules.readOnly = createModuleResource(() => ready.then(() => import("./read-only-mode")));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function setup(): Promise<ReturnType<typeof render>> {
  const props = createStoryArgs({
    canTranslate: true,
    canProofread: false,
    units: [undoUnit("u1", "initial")],
  });
  const view = render(<BaseTranslator {...props} />);
  await view.findByPlaceholderText("点击输入翻译...");
  return view;
}

async function finishReadOnlyLoad(): Promise<void> {
  await act(async () => {
    modules.resolve();
    await modules.readOnly?.load();
  });
}

test("editing and diff preserve the canvas transform, scroll container and annotation control", async () => {
  const view = await setup();
  const canvas = view.getByRole("application");
  const row = view.container.querySelector('[data-unit-id="page-1-u1"]');
  const list = row?.parentElement;
  expect(list).toBeInstanceOf(HTMLElement);
  if (!list) throw new Error("Missing unit list");
  list.scrollTop = 89;
  fireEvent.click(view.getByRole("button", { name: "注释编辑" }));
  fireEvent.keyDown(canvas, { key: "ArrowRight" });
  fireEvent.wheel(canvas, { deltaY: -100, clientX: 0, clientY: 0 });
  const pan = canvas.querySelector<HTMLElement>('[style*="translate"]');
  const zoom = canvas.querySelector<HTMLElement>('[style*="scale"]');
  expect(pan?.style.transform).toBe("translate(-25.92px, 0px)");
  expect(zoom?.style.transform).toBe("scale(1.08)");
  const transform = pan?.style.transform;
  fireEvent.click(view.getByRole("button", { name: "切换到只读模式" }));
  await finishReadOnlyLoad();
  await view.findByRole("textbox", { name: "翻译与校对差异" });
  expect(view.getByRole("application")).toBe(canvas);
  expect(canvas.querySelector('[style*="translate"]')).toBe(pan);
  expect(canvas.querySelector('[style*="scale"]')).toBe(zoom);
  expect(pan?.style.transform).toBe(transform);
  expect(zoom?.style.transform).toBe("scale(1.08)");
  expect(view.container.querySelector('[data-unit-id="page-1-u1"]')?.parentElement).toBe(list);
  expect(list.scrollTop).toBe(89);
  expect(view.getByRole("button", { name: "注释编辑" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(view.getByRole("button", { name: "切换到翻译模式" }));
  await view.findByPlaceholderText("点击输入翻译...");
  expect(view.getByRole("application")).toBe(canvas);
  expect(list.scrollTop).toBe(89);
  expect(zoom?.style.transform).toBe("scale(1.08)");
});

test("a ready target waits for a new IME composition and preserves its committed text", async () => {
  const view = await setup();
  const input = view.getByPlaceholderText("点击输入翻译...");
  fireEvent.click(view.getByRole("button", { name: "切换到只读模式" }));
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: "initialni" } });
  await finishReadOnlyLoad();
  expect(input.isConnected).toBe(true);
  expect(input).toHaveValue("initialni");
  expect(view.queryByRole("textbox", { name: "翻译与校对差异" })).toBeNull();
  fireEvent.change(input, { target: { value: "initial你好" } });
  await act(async () => {
    fireEvent.compositionEnd(input);
    await Promise.resolve();
  });
  await view.findByRole("textbox", { name: "翻译与校对差异" });
  fireEvent.click(view.getByRole("button", { name: "切换到翻译模式" }));
  await waitFor(() => {
    expect(view.getByPlaceholderText("点击输入翻译...")).toHaveValue("initial你好");
  });
});

test("external start mode waits for the target and IME without replacing the workbench", async () => {
  const props = createStoryArgs({
    canTranslate: true,
    canProofread: false,
    units: [undoUnit("u1", "initial")],
  });
  const view = render(<BaseTranslator {...props} />);
  const input = await view.findByPlaceholderText("点击输入翻译...");
  const canvas = view.getByRole("application");
  const list = view.container.querySelector('[data-unit-id="page-1-u1"]')?.parentElement;
  if (!list) throw new Error("Missing unit list");
  list.scrollTop = 71;
  fireEvent.keyDown(canvas, { key: "ArrowLeft" });
  const pan = canvas.querySelector<HTMLElement>('[style*="translate"]');
  fireEvent.change(input, { target: { value: "committed" } });
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: "committedni" } });
  view.rerender(<BaseTranslator {...props} startMode="readOnly" />);
  await finishReadOnlyLoad();
  expect(input.isConnected).toBe(true);
  expect(input).toHaveValue("committedni");
  expect(view.getByRole("application")).toBe(canvas);
  await act(async () => {
    fireEvent.change(input, { target: { value: "committed你好" } });
    fireEvent.compositionEnd(input);
    await Promise.resolve();
  });
  await view.findByRole("textbox", { name: "翻译与校对差异" });
  expect(view.getByRole("application")).toBe(canvas);
  expect(pan?.style.transform).toBe("translate(24px, 0px)");
  expect(list.scrollTop).toBe(71);
  expect(view.container.querySelector('[data-unit-id="page-1-u1"]')?.parentElement).toBe(list);
  view.rerender(<BaseTranslator {...props} />);
  await waitFor(() => {
    expect(view.getByPlaceholderText("点击输入翻译...")).toHaveValue("committed你好");
  });
});

test("revoked permissions immediately disable the retained editor and keep committed drafts", async () => {
  const props = createStoryArgs({
    canTranslate: true,
    canProofread: false,
    units: [undoUnit("u1", "initial")],
  });
  const view = render(<BaseTranslator {...props} />);
  const input = await view.findByPlaceholderText("点击输入翻译...");
  const canvas = view.getByRole("application");
  const list = view.container.querySelector('[data-unit-id="page-1-u1"]')?.parentElement;
  if (!list) throw new Error("Missing unit list");
  list.scrollTop = 53;
  fireEvent.keyDown(canvas, { key: "ArrowLeft" });
  const pan = canvas.querySelector<HTMLElement>('[style*="translate"]');
  fireEvent.change(input, { target: { value: "committed draft" } });
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: "committed draftni" } });
  view.rerender(<BaseTranslator {...props} canTranslate={false} canWrite={false} />);
  expect(input).toHaveAttribute("readonly");
  expect(view.queryByRole("button", { name: /保存 ·/u })).toBeNull();
  expect(view.queryByRole("button", { name: "工具菜单" })).toBeNull();
  expect(view.getByRole("application")).toBe(canvas);
  await finishReadOnlyLoad();
  expect(input.isConnected).toBe(true);
  await act(async () => {
    fireEvent.compositionEnd(input);
    await Promise.resolve();
  });
  await view.findByRole("textbox", { name: "翻译与校对差异" });
  expect(view.getByRole("application")).toBe(canvas);
  expect(pan?.style.transform).toBe("translate(24px, 0px)");
  expect(view.container.querySelector('[data-unit-id="page-1-u1"]')?.parentElement).toBe(list);
  expect(list.scrollTop).toBe(53);
  view.rerender(<BaseTranslator {...props} />);
  await waitFor(() => {
    expect(view.getByPlaceholderText("点击输入翻译...")).toHaveValue("committed draft");
  });
});

test("an initial native module failure offers an explicit page refresh", async () => {
  const loader = vi.fn<() => Promise<TranslatorModeModule>>(() =>
    Promise.reject(new Error("offline")),
  );
  modules.editing = createModuleResource(loader);
  const props = createStoryArgs({ canTranslate: true, canProofread: false });
  const view = render(<BaseTranslator {...props} />);
  fireEvent.click(await view.findByRole("button", { name: "刷新页面" }));
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(loader).toHaveBeenCalledTimes(1);
  expect(view.queryByRole("button", { name: "重试" })).toBeNull();
});
