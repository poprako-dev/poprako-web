import { expect, it } from "vitest";
import type { Psd } from "ag-psd";
import { indexPsdLayers } from "./psd-layer";
import { includesRevisionLayer } from "./revision-page";
it("keeps PSD index paths distinct for duplicate names, hidden groups and nested layers", () => {
  const psd: Psd = {
    width: 1000,
    height: 2000,
    children: [
      { name: "对白", left: 100, top: 200, right: 300, bottom: 600 },
      {
        name: "组",
        hidden: true,
        children: [{ name: "对白", left: 0, top: 0, right: 10, bottom: 10 }],
      },
    ],
  };
  const { layers } = indexPsdLayers(psd);
  expect(layers.map((layer) => [layer.id, layer.parentId, layer.name, layer.visible])).toEqual([
    ["0.0", null, "对白", true],
    ["0.1", null, "组", false],
    ["0.1.0", "0.1", "对白", false],
  ]);
  expect(layers[0]?.bounds).toEqual({ xCoord: 0.1, yCoord: 0.1, width: 0.2, height: 0.2 });
  expect(includesRevisionLayer(layers, "0.1", "0.1.0")).toBe(true);
  expect(includesRevisionLayer(layers, "0.1", "0.0")).toBe(false);
  expect(includesRevisionLayer(layers, null, null)).toBe(true);
  expect(includesRevisionLayer(layers, "0.0", null)).toBe(false);
});
