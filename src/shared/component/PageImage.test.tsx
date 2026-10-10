import { StrictMode, createRef } from "react";
import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { PageImage } from "./PageImage";

it("mounts the owned canvas through StrictMode and resize without recreating its surface", () => {
  const source = document.createElement("canvas");
  source.width = 900;
  source.height = 1280;
  const imageRef = createRef<HTMLImageElement | HTMLCanvasElement>();
  const view = render(
    <StrictMode>
      <PageImage source={source} imageRef={imageRef} maxWidth={450} maxHeight={640} />
    </StrictMode>,
  );
  expect(view.container.querySelector("canvas")).toBe(source);
  expect(imageRef.current).toBe(source);
  view.rerender(
    <StrictMode>
      <PageImage source={source} imageRef={imageRef} maxWidth={225} maxHeight={320} />
    </StrictMode>,
  );
  expect(view.container.querySelectorAll("canvas")).toHaveLength(1);
  expect(source.style.maxWidth).toBe("225px");
  expect(source.width).toBe(900);
  expect(source.height).toBe(1280);
  view.unmount();
  expect(source.isConnected).toBe(false);
  expect(imageRef.current).toBeNull();
  // Storage belongs to the page, so detaching must also allow a later remount.
  expect(source.width).toBe(900);
});

it("detaches the old surface when replacing a page and still accepts URL images", () => {
  const first = document.createElement("canvas");
  const second = document.createElement("canvas");
  const imageRef = createRef<HTMLImageElement | HTMLCanvasElement>();
  const view = render(
    <PageImage source={first} imageRef={imageRef} maxWidth={400} maxHeight={600} />,
  );
  view.rerender(<PageImage source={second} imageRef={imageRef} maxWidth={400} maxHeight={600} />);
  expect(first.isConnected).toBe(false);
  expect(imageRef.current).toBe(second);
  expect(view.container.querySelectorAll("canvas")).toHaveLength(1);
  view.rerender(
    <PageImage source="/page.png" imageRef={imageRef} maxWidth={400} maxHeight={600} />,
  );
  expect(second.isConnected).toBe(false);
  expect(view.container.querySelector("canvas")).toBeNull();
  expect(view.container.querySelector("img")).toBe(imageRef.current);
  expect(imageRef.current?.getAttribute("src")).toBe("/page.png");
});
