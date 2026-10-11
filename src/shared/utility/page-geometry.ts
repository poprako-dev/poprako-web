export type PageRect = { xCoord: number; yCoord: number; width: number; height: number };
export type PageImageSource = string | HTMLCanvasElement;
export type PagePreview = { source: PageImageSource; bounds: PageRect };
export function previewPosition(rect: PageRect): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  return {
    left: `${String(rect.xCoord * 100)}%`,
    top: `${String(rect.yCoord * 100)}%`,
    width: `${String(rect.width * 100)}%`,
    height: `${String(rect.height * 100)}%`,
  };
}
