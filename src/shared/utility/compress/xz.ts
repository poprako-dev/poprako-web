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

class XzCodec {
  private readonly module = getModule();
  private readonly stream = new WasmLzmaStream(this.module);
  private output = 0;
  private input = 0;
  private isFinished = false;

  initialize(isDecompressing: boolean, preset: number): void {
    if (isDecompressing) {
      decoderInit(this.stream, 64 * 1024 * 1024);
    } else {
      encoderInit(this.stream, preset);
    }
    this.output = copyToWasm(this.module, new Uint8Array(CHUNK_SIZE));
  }

  *transformChunk(chunk: Uint8Array): Generator<Uint8Array, void, unknown> {
    if (this.isFinished && chunk.length > 0) {
      throw new Error("Unexpected bytes after the XZ stream");
    }
    for (let offset = 0; offset < chunk.length && !this.isFinished; offset += CHUNK_SIZE) {
      this.input = copyToWasm(this.module, chunk.subarray(offset, offset + CHUNK_SIZE));
      this.stream.setInput(this.input, Math.min(CHUNK_SIZE, chunk.length - offset));
      do {
        this.stream.setOutput(this.output, CHUNK_SIZE);
        const result = code(this.stream, LZMA_RUN);
        if (result !== LZMA_OK && result !== LZMA_STREAM_END) {
          throw new Error(`XZ codec error: ${String(result)}`);
        }
        const produced = CHUNK_SIZE - this.stream.availOut;
        if (produced > 0) {
          yield copyFromWasm(this.module, this.output, produced);
        }
        if (result === LZMA_STREAM_END) {
          this.isFinished = true;
          if (this.stream.availIn !== 0) {
            throw new Error("Unexpected bytes after the XZ stream");
          }
        }
      } while (!this.isFinished && (this.stream.availIn > 0 || this.stream.availOut === 0));
      this.module._free(this.input);
      this.input = 0;
    }
  }

  *finish(): Generator<Uint8Array, void, unknown> {
    this.stream.setInput(0, 0);
    while (!this.isFinished) {
      this.stream.setOutput(this.output, CHUNK_SIZE);
      const result = code(this.stream, LZMA_FINISH);
      if (result !== LZMA_OK && result !== LZMA_STREAM_END) {
        throw new Error(`Incomplete or invalid XZ stream: ${String(result)}`);
      }
      const produced = CHUNK_SIZE - this.stream.availOut;
      if (produced > 0) {
        yield copyFromWasm(this.module, this.output, produced);
      }
      this.isFinished = result === LZMA_STREAM_END;
      if (!this.isFinished && produced === 0) {
        throw new Error("Incomplete XZ stream");
      }
    }
  }

  dispose(): void {
    end(this.stream);
    this.stream.free();
    if (this.input) {
      this.module._free(this.input);
    }
    if (this.output) {
      this.module._free(this.output);
    }
  }
}

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
  const codec = new XzCodec();
  try {
    codec.initialize(isDecompressing, preset);
    for await (const chunk of readChunks(source)) {
      yield* codec.transformChunk(chunk);
    }
    yield* codec.finish();
  } finally {
    codec.dispose();
  }
}

export function xzStream(
  source: ReadableStream<Uint8Array>,
  isDecompressing: boolean,
  preset = 3,
): ReadableStream<Uint8Array> {
  return fromIterator(transform(source, isDecompressing, preset));
}
