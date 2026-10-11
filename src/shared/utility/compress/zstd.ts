import { fromIterator, readChunks } from "./streams.ts";
import { ZstdCodec } from "./zstd-codec.ts";

async function* transform(
  source: ReadableStream<Uint8Array>,
  isDecompressing: boolean,
  level: number,
): AsyncGenerator<Uint8Array, void, unknown> {
  const codec = await ZstdCodec.create(isDecompressing, level);
  try {
    for await (const chunk of readChunks(source)) {
      yield* codec.transformChunk(chunk);
    }
    yield* codec.finish();
  } finally {
    codec.dispose();
  }
}

/** One Zstandard frame, with bounded output and upstream cancellation. */
export function zstdStream(
  source: ReadableStream<Uint8Array>,
  isDecompressing: boolean,
  level = 3,
): ReadableStream<Uint8Array> {
  return fromIterator(transform(source, isDecompressing, level));
}
