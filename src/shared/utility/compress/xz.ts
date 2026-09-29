import {
  code,
  copyFromWasm,
  copyToWasm,
  decoderInit,
  encoderInit,
  end,
  getModule,
  LZMA_FINISH,
  LZMA_OK,
  LZMA_RUN,
  LZMA_STREAM_END,
  WasmLzmaStream,
} from "node-liblzma/wasm";
import { fromIterator, readChunks } from "@/shared/utility/compress/streams";

const CHUNK_SIZE = 64 * 1024;

/**
 * Pull one bounded output block at a time. The upstream TransformStream helper
 * drains all output for an input chunk synchronously, bypassing output backpressure.
 * Uses only public WASM bindings; finally also releases allocations on cancellation.
 * Accepts one XZ stream, rejecting trailing bytes/concatenated streams intentionally.
 */
async function* transform(
  source: ReadableStream<Uint8Array>,
  isDecompressing: boolean,
  preset: number,
): AsyncGenerator<Uint8Array, void, unknown> {
  const module = getModule();
  const stream = new WasmLzmaStream(module);
  let output = 0;
  let input = 0;
  let isFinished = false;
  try {
    if (isDecompressing) {
      decoderInit(stream, 64 * 1024 * 1024);
    } else {
      encoderInit(stream, preset);
    }
    output = copyToWasm(module, new Uint8Array(CHUNK_SIZE));
    for await (const chunk of readChunks(source)) {
      if (isFinished && chunk.length > 0) {
        throw new Error("Unexpected bytes after the XZ stream");
      }
      for (let offset = 0; offset < chunk.length && !isFinished; offset += CHUNK_SIZE) {
        input = copyToWasm(module, chunk.subarray(offset, offset + CHUNK_SIZE));
        stream.setInput(input, Math.min(CHUNK_SIZE, chunk.length - offset));
        do {
          stream.setOutput(output, CHUNK_SIZE);
          const result = code(stream, LZMA_RUN);
          if (result !== LZMA_OK && result !== LZMA_STREAM_END) {
            throw new Error(`XZ codec error: ${String(result)}`);
          }
          const produced = CHUNK_SIZE - stream.availOut;
          if (produced > 0) {
            yield copyFromWasm(module, output, produced);
          }
          if (result === LZMA_STREAM_END) {
            isFinished = true;
            if (stream.availIn !== 0) {
              throw new Error("Unexpected bytes after the XZ stream");
            }
          }
        } while (!isFinished && (stream.availIn > 0 || stream.availOut === 0));
        module._free(input);
        input = 0;
      }
    }
    stream.setInput(0, 0);
    while (!isFinished) {
      stream.setOutput(output, CHUNK_SIZE);
      const result = code(stream, LZMA_FINISH);
      if (result !== LZMA_OK && result !== LZMA_STREAM_END) {
        throw new Error(`Incomplete or invalid XZ stream: ${String(result)}`);
      }
      const produced = CHUNK_SIZE - stream.availOut;
      if (produced > 0) {
        yield copyFromWasm(module, output, produced);
      }
      isFinished = result === LZMA_STREAM_END;
      if (!isFinished && produced === 0) {
        throw new Error("Incomplete XZ stream");
      }
    }
  } finally {
    end(stream);
    stream.free();
    if (input) {
      module._free(input);
    }
    if (output) {
      module._free(output);
    }
  }
}

export function xzStream(
  source: ReadableStream<Uint8Array>,
  isDecompressing: boolean,
  preset = 3,
): ReadableStream<Uint8Array> {
  return fromIterator(transform(source, isDecompressing, preset));
}
