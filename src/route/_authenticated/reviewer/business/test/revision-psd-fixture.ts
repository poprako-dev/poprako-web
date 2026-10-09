import { writePsd } from "ag-psd";
import type { Layer } from "ag-psd";
const cache = new Map<string, Promise<Blob>>();
async function encodeFixture(imageUrl: string): Promise<Blob> {
  const image = new Image();
  image.src = imageUrl;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Fixture canvas is unavailable");
  context.drawImage(image, 0, 0);
  const drawing = context;
  function crop(left: number, top: number, width: number, height: number): Layer {
    return {
      name: "对白",
      left,
      top,
      right: left + width,
      bottom: top + height,
      imageData: drawing.getImageData(left, top, width, height),
    };
  }
  const buffer = writePsd(
    {
      width: canvas.width,
      height: canvas.height,
      imageData: context.getImageData(0, 0, canvas.width, canvas.height),
      children: [
        {
          name: "原画",
          left: 0,
          top: 0,
          right: canvas.width,
          bottom: canvas.height,
          imageData: context.getImageData(0, 0, canvas.width, canvas.height),
        },
        {
          name: "文字",
          children: [crop(620, 100, 180, 125), crop(75, 480, 155, 135), crop(620, 480, 195, 135)],
        },
        { name: "空图层", left: 0, top: 0, right: 0, bottom: 0, hidden: true },
      ],
    },
    { compress: true },
  );
  canvas.width = 0;
  canvas.height = 0;
  return new Blob([buffer], { type: "image/vnd.adobe.photoshop" });
}
export function revisionPsdFixture(imageUrl: string): Promise<Blob> {
  const previous = cache.get(imageUrl);
  if (previous) return previous;
  const pending = encodeFixture(imageUrl);
  cache.set(imageUrl, pending);
  return pending;
}
