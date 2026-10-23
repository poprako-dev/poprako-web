import { act, render } from "@testing-library/react";
import { useRef } from "react";
import type { JSX } from "react/jsx-runtime";
import { expect, test, vi } from "vitest";
import { LineBreakOverlay } from "./LineBreakOverlay";

type Props = { text: string; focused: boolean };

function Example({ text, focused }: Props): JSX.Element {
  const targetRef = useRef<HTMLDivElement>(null);
  return (
    <div>
      <div ref={targetRef}>{text}</div>
      <LineBreakOverlay targetRef={targetRef} contentKey={text} styleKey={focused} />
    </div>
  );
}

function mockMeasurements(): {
  measure: ReturnType<typeof vi.fn>;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  resize: () => void;
  fonts: EventTarget;
  flush: () => void;
} {
  const measure = vi.fn(() => new DOMRect(1, 2, 0, 20));
  vi.spyOn(document, "createRange").mockReturnValue({
    setStart: vi.fn(),
    setEnd: vi.fn(),
    getBoundingClientRect: measure,
  } as unknown as Range);
  const observe = vi.fn();
  const disconnect = vi.fn();
  let notify = (): void => undefined;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        notify = callback;
      }
      observe = observe;
      disconnect = disconnect;
    },
  );
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  const fonts = Object.assign(new EventTarget(), { status: "loaded" });
  Object.defineProperty(document, "fonts", { value: fonts, configurable: true });
  return {
    measure,
    observe,
    disconnect,
    resize: () => {
      notify();
    },
    fonts,
    flush: () => {
      frames.shift()?.(0);
    },
  };
}

test("unchanged renders skip ranges and keep observers, real text/style/resize/font changes measure", () => {
  const { measure, observe, disconnect, resize, fonts, flush } = mockMeasurements();
  try {
    const view = render(<Example text={"a\nb"} focused={false} />);
    expect(measure).toHaveBeenCalledTimes(1);
    view.rerender(<Example text={"a\nb"} focused={false} />);
    expect(measure).toHaveBeenCalledTimes(1);
    view.rerender(<Example text={"aa\nb"} focused={false} />);
    view.rerender(<Example text={"aa\nb"} focused />);
    expect(measure).toHaveBeenCalledTimes(3);
    act(() => {
      resize();
      flush();
    });
    expect(measure).toHaveBeenCalledTimes(4);
    act(() => {
      fonts.dispatchEvent(new Event("loadingdone"));
      flush();
    });
    expect(measure).toHaveBeenCalledTimes(5);
    expect(observe).toHaveBeenCalledTimes(1);
    expect(disconnect).not.toHaveBeenCalled();
    view.unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  } finally {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, "fonts");
  }
});
