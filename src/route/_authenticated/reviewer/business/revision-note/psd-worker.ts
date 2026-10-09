import { releasePsdBuffer } from "./release-psd-buffer";
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
function getPixels(data: PixelData | undefined): Uint8ClampedArray<ArrayBuffer> {
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
  return pixels;
}
async function handle(request: PsdRequest): Promise<void> {
  let bytes: ArrayBuffer | null = null;
  try {
    bytes = await request.file.arrayBuffer();
    const psd = readPsd(bytes, {
      useRawData: true,
      useImageData: true,
      skipLayerImageData: true,
      skipThumbnail: true,
      skipLinkedFilesData: true,
    });
    const { width, height } = psd;
    if (width <= 0 || height <= 0) throw new Error("PSD 页面尺寸无效");
    const layers = indexPsdLayers(psd);
    // The composite is a view into the entire PSD, including unused layer pixels.
    // Keep only its compressed bytes before allocating the full RGBA surface.
    const composite = psd.rawCompositeData?.slice();
    if (composite) psd.rawCompositeData = composite;
    releasePsdBuffer(bytes);
    const pixels = getPixels(getCompositeImageData(psd));
    if (composite) releasePsdBuffer(composite.buffer);
    // Upload in the worker and transfer its image, avoiding a CPU-backed bitmap
    // in the display context and its retained raster/upload caches.
    const surface = new OffscreenCanvas(width, height);
    const context = surface.getContext("2d", { willReadFrequently: false });
    if (!context) throw new Error("无法创建 PSD 预览画布");
    context.putImageData(new ImageData(pixels, width, height), 0, 0);
    const image = surface.transferToImageBitmap();
    surface.width = 0;
    surface.height = 0;
    releasePsdBuffer(pixels.buffer);
    const response: PsdResponse = { id: request.id, type: "opened", width, height, layers, image };
    // Transfer the final image without encoding or cloning its pixels.
    postMessage(response, { transfer: [image] });
  } catch (error) {
    postMessage({
      id: request.id,
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    } satisfies PsdResponse);
  } finally {
    if (bytes) releasePsdBuffer(bytes);
  }
}
globalThis.onmessage = (event: MessageEvent<PsdRequest>): void => {
  void handle(event.data);
};
