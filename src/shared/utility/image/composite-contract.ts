export type CompositeStage = "decoding" | "encoding";
export type CompositeResult = { blob: Blob; hash: string };
export type CompositeMessage =
  | { stage: CompositeStage }
  | { result: CompositeResult }
  | { error: string };
export function compositeSize(width: number, height: number): { width: number; height: number } {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0)
    throw new Error("PSD 页面尺寸无效");
  const ratio = Math.min(
    1,
    (width > height ? 2560 : 1440) / width,
    (width > height ? 1440 : 2560) / height,
  );
  return {
    width: Math.max(1, Math.floor(width * ratio)),
    height: Math.max(1, Math.floor(height * ratio)),
  };
}
