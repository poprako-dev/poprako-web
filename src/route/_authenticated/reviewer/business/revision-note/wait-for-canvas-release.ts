// DOM removal and presentation are asynchronous. Do not overlap the next PSD's
// allocations with a surface still attached to the previous rendered frame.
export function waitForCanvasRelease(canvas: HTMLCanvasElement): Promise<void> {
  if (!canvas.isConnected) return Promise.resolve();
  return new Promise((resolve) => {
    function afterDetach(): void {
      if (canvas.isConnected) {
        requestAnimationFrame(afterDetach);
      } else {
        requestAnimationFrame(() => {
          resolve();
        });
      }
    }
    requestAnimationFrame(afterDetach);
  });
}
