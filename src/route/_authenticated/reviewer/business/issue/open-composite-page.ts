import type { ReviewPage } from "./review-page";

export function openCompositePage(url: string, signal: AbortSignal): Promise<ReviewPage> {
  signal.throwIfAborted();
  return Promise.resolve({
    composite: { source: url, bounds: { xCoord: 0, yCoord: 0, width: 1, height: 1 } },
    dispose() {
      // The shared PageImage owns the browser image lifecycle.
    },
  });
}
