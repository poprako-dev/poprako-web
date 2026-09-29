/**
Read without DOM.AsyncIterable, including cancellation when consumption stops.
*/
export async function* readChunks(
  source: ReadableStream<Uint8Array>,
): AsyncGenerator<Uint8Array, void, unknown> {
  const reader = source.getReader();
  try {
    for (;;) {
      const result = await reader.read();
      if (result.done) {
        return;
      }
      yield result.value;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      /* Preserve the original stream error. */
    }
    reader.releaseLock();
  }
}

export function fromIterator(iterator: AsyncGenerator<Uint8Array>): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>(
    {
      async pull(controller) {
        try {
          const result = await iterator.next();
          if (result.done) {
            controller.close();
          } else {
            controller.enqueue(result.value);
          }
        } catch (error) {
          controller.error(error);
        }
      },
      async cancel() {
        await iterator.return(undefined);
      },
    },
    { highWaterMark: 0 },
  );
}
