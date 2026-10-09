import { getCompositeImageData, initializeCanvas, readPsd } from "ag-psd";
import type { PixelData } from "ag-psd";
import { indexPsdLayers } from "./psd-layer";
import type { PsdRequest, PsdResponse } from "./psd-protocol";
initializeCanvas(
  () => {
    throw new Error("PSD worker uses pixel data and OffscreenCanvas");
  },
  (width, height) => new ImageData(width, height),
);
async function encode(data: PixelData | undefined): Promise<Blob> {
  if (!data || data.width === 0 || data.height === 0) throw new Error("PSD 中没有可读取的栅格图像");
  const source = data.data;
  let pixels: Uint8ClampedArray<ArrayBuffer>;
  if (
    (source instanceof Uint8ClampedArray || source instanceof Uint8Array) &&
    source.buffer instanceof ArrayBuffer
  ) {
    pixels = new Uint8ClampedArray(source.buffer, source.byteOffset, source.byteLength);
  } else {
    pixels = new Uint8ClampedArray(source.length);
    for (let i = 0; i < source.length; i++) {
      const value = source[i] ?? 0;
      pixels[i] =
        source instanceof Uint16Array
          ? value / 257
          : source instanceof Float32Array
            ? Math.pow(Math.max(0, value), 1 / 2.2) * 255
            : value;
    }
  }
  const canvas = new OffscreenCanvas(data.width, data.height);
  // PNG encoding reads the canvas back; avoid the default GPU upload/readback path.
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("无法创建 PSD 预览画布");
  context.putImageData(new ImageData(pixels, data.width, data.height), 0, 0);
  const image = await canvas.convertToBlob({ type: "image/png" });
  canvas.width = 0;
  canvas.height = 0;
  return image;
}
async function handle(request: PsdRequest): Promise<void> {
  try {
    const psd = readPsd(await request.file.arrayBuffer(), {
      useRawData: true,
      useImageData: true,
      skipLayerImageData: true,
      skipThumbnail: true,
      skipLinkedFilesData: true,
    });
    const { width, height } = psd;
    if (width <= 0 || height <= 0) throw new Error("PSD 页面尺寸无效");
    const layers = indexPsdLayers(psd);
    const image = await encode(getCompositeImageData(psd));
    const response: PsdResponse = { id: request.id, type: "opened", width, height, layers, image };
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
  void handle(event.data);
};
