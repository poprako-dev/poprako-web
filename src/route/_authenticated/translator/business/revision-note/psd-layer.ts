import type { Layer, Psd } from "ag-psd";
import type { PageRect, RevisionLayer } from "./revision-page";
export function layerBounds(layer: Layer, width: number, height: number): PageRect {
  return {
    xCoord: (layer.left ?? 0) / width,
    yCoord: (layer.top ?? 0) / height,
    width: ((layer.right ?? 0) - (layer.left ?? 0)) / width,
    height: ((layer.bottom ?? 0) - (layer.top ?? 0)) / height,
  };
}
export function indexPsdLayers(psd: Psd): { layers: RevisionLayer[]; byId: Map<string, Layer> } {
  const layers: RevisionLayer[] = [];
  const byId = new Map<string, Layer>();
  function visit(
    children: Layer[],
    parentId: string | null,
    path: string,
    parentVisible: boolean,
  ): void {
    children.forEach((layer, index) => {
      const id = `${path}.${String(index)}`;
      const visible = parentVisible && !layer.hidden;
      const bounds = layerBounds(layer, psd.width, psd.height);
      byId.set(id, layer);
      layers.push({
        id,
        parentId,
        name: layer.name ?? "",
        bounds,
        visible,
        canPreview:
          !layer.children &&
          bounds.width > 0 &&
          bounds.height > 0 &&
          Boolean(
            layer.rawData?.channels.some(
              (channel) => [0, 1, 2, 3].includes(channel.id) && channel.data?.byteLength,
            ),
          ),
      });
      visit(layer.children ?? [], id, id, visible);
    });
  }
  visit(psd.children ?? [], null, "0", true);
  return { layers, byId };
}
