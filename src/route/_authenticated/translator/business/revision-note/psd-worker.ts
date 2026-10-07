import { getCompositeImageData, getLayerImageData, initializeCanvas, readPsd } from "ag-psd";
import type { Layer, PixelData } from "ag-psd";
import { indexPsdLayers, layerBounds } from "./psd-layer";
import type { PsdRequest, PsdResponse } from "./psd-protocol";
initializeCanvas(
  () => {
    throw new Error("PSD worker uses pixel data and OffscreenCanvas");
  },
  (width, height) => new ImageData(width, height),
);
let layers = new Map<string, Layer>();
let width = 0;
let height = 0;
let latestRender = 0;
let queue = Promise.resolve();
async function encode(data: PixelData | undefined): Promise<Blob> {
  if (!data || data.width === 0 || data.height === 0) throw new Error("PSD 中没有可读取的栅格图像");
  const pixels = new Uint8ClampedArray(data.data.length);
  const source = data.data;
  for (let i = 0; i < source.length; i++) {
    const value = source[i] ?? 0;
    pixels[i] =
      source instanceof Uint16Array
        ? value / 257
        : source instanceof Float32Array
          ? Math.pow(Math.max(0, value), 1 / 2.2) * 255
          : value;
  }
  const canvas = new OffscreenCanvas(data.width, data.height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法创建 PSD 预览画布");
  context.putImageData(new ImageData(pixels, data.width, data.height), 0, 0);
  const image = await canvas.convertToBlob({ type: "image/png" });
  canvas.width = 0;
  canvas.height = 0;
  return image;
}
async function handle(request: PsdRequest): Promise<void> {
  try {
    let response: PsdResponse;
    if (request.type === "open") {
      const psd = readPsd(await request.file.arrayBuffer(), {
        useRawData: true,
        useImageData: true,
        skipThumbnail: true,
        skipLinkedFilesData: true,
      });
      width = psd.width;
      height = psd.height;
      if (width <= 0 || height <= 0) throw new Error("PSD 页面尺寸无效");
      const indexed = indexPsdLayers(psd);
      layers = indexed.byId;
      const image = await encode(getCompositeImageData(psd));
      response = { id: request.id, type: "opened", width, height, layers: indexed.layers, image };
    } else {
      if (request.id !== latestRender)
        throw new DOMException("Layer request superseded", "AbortError");
      const layer = layers.get(request.layerId);
      if (!layer) throw new Error("PSD 图层不存在");
      const image = await encode(getLayerImageData(layer));
      response = {
        id: request.id,
        type: "rendered",
        bounds: layerBounds(layer, width, height),
        image,
      };
    }
    postMessage(response);
  } catch (error) {
    postMessage({
      id: request.id,
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    } satisfies PsdResponse);
  }
}
globalThis.onmessage = (event: MessageEvent<PsdRequest>): void => {
  if (event.data.type === "render") latestRender = event.data.id;
  queue = queue.then(() => handle(event.data));
};
