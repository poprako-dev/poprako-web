import { getCompositeImageData, initializeCanvas, readPsd } from "ag-psd";
import type { PixelData } from "ag-psd";
import { sha256 } from "@noble/hashes/sha2.js";
import { releasePsdBuffer } from "./release-buffer";
import { readCompositeFile } from "./read-composite";
import { compositeSize } from "./composite-contract";
import type { CompositeMessage } from "./composite-contract";
initializeCanvas(
  () => {
    throw new Error("Worker uses OffscreenCanvas");
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

async function convert(file: File): Promise<void> {
  let bytes: ArrayBuffer | null = null;
  try {
    postMessage({ stage: "decoding" } satisfies CompositeMessage);
    bytes = await readCompositeFile(file);
    const psd = readPsd(bytes, {
      useRawData: true,
      useImageData: true,
      skipLayerImageData: true,
      skipThumbnail: true,
      skipLinkedFilesData: true,
    });
    const size = compositeSize(psd.width, psd.height);
    const pixels = getPixels(getCompositeImageData(psd));
    releasePsdBuffer(bytes);
    const source = new OffscreenCanvas(psd.width, psd.height);
    const context = source.getContext("2d");
    if (!context) throw new Error("无法读取 PSD 图像");
    context.putImageData(new ImageData(pixels, psd.width, psd.height), 0, 0);
    releasePsdBuffer(pixels.buffer);
    postMessage({ stage: "encoding" } satisfies CompositeMessage);
    const output = new OffscreenCanvas(size.width, size.height);
    const outputContext = output.getContext("2d");
    if (!outputContext) throw new Error("无法生成 WebP");
    outputContext.drawImage(source, 0, 0, size.width, size.height);
    source.width = 0;
    source.height = 0;
    const blob = await output.convertToBlob({ type: "image/webp", quality: 0.8 });
    output.width = 0;
    output.height = 0;
    if (blob.type !== "image/webp" || blob.size === 0)
      throw new Error("当前浏览器无法生成 WebP，请使用新版 Chrome 或 Edge");
    const hash = btoa(String.fromCodePoint(...sha256(new Uint8Array(await blob.arrayBuffer()))));
    postMessage({ result: { blob, hash } } satisfies CompositeMessage);
  } catch (error) {
    postMessage({
      error: error instanceof Error ? error.message : String(error),
    } satisfies CompositeMessage);
  } finally {
    if (bytes) releasePsdBuffer(bytes);
  }
}
globalThis.onmessage = (event: MessageEvent<File>): void => {
  void convert(event.data);
};
