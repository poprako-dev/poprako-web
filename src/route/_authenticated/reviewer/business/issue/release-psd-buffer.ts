// Drop large temporary storage as soon as its last consumer finishes. Older browsers
// without ArrayBuffer.transfer still work, but release through garbage collection.
export function releasePsdBuffer(buffer: ArrayBuffer): void {
  if (buffer.byteLength === 0) return;
  const transferable = buffer as ArrayBuffer & { transfer?: (length: number) => ArrayBuffer };
  transferable.transfer?.(0);
}
