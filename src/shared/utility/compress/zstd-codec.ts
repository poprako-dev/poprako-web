import { compile, type ZstdExports } from "simple-wasi-zstd";

export const ZSTD_CHUNK_SIZE = 64 * 1024;
const WINDOW_LOG = 28;
let compiled: Promise<WebAssembly.Module> | undefined;

export class ZstdCodec {
  private context = 0;
  private input = 0;
  private output = 0;
  private inputPosition = 0;
  private outputPosition = 0;
  private isFinished = false;
  private readonly module: ZstdExports;
  private readonly isDecompressing: boolean;

  private constructor(module: ZstdExports, isDecompressing: boolean) {
    this.module = module;
    this.isDecompressing = isDecompressing;
  }

  static async create(isDecompressing: boolean, level: number): Promise<ZstdCodec> {
    compiled ??= compile();
    const instance = await WebAssembly.instantiate(await compiled, {
      wasi_snapshot_preview1: {
        fd_seek: () => 8,
        fd_write: () => 8,
        fd_close: () => 8,
      },
    });
    const codec = new ZstdCodec(instance.exports as ZstdExports, isDecompressing);
    try {
      codec.initialize(level);
      return codec;
    } catch (error) {
      codec.dispose();
      throw error;
    }
  }

  private initialize(level: number): void {
    const z = this.module;
    this.context = this.isDecompressing ? z.ZSTD_createDCtx() : z.ZSTD_createCCtx();
    if (!this.context) throw new Error("Could not allocate Zstandard context");
    if (this.isDecompressing) {
      this.check(z.ZSTD_DCtx_setParameter(this.context, 100, WINDOW_LOG));
    } else {
      // ZSTD_c_compressionLevel, windowLog, enableLongDistanceMatching, checksumFlag.
      for (const [parameter, value] of [
        [100, level],
        [101, WINDOW_LOG],
        [160, 1],
        [201, 1],
      ] as const) {
        this.check(z.ZSTD_CCtx_setParameter(this.context, parameter, value));
      }
    }
    this.input = this.allocate(ZSTD_CHUNK_SIZE);
    this.output = this.allocate(ZSTD_CHUNK_SIZE);
    this.inputPosition = this.allocate(4);
    this.outputPosition = this.allocate(4);
  }

  private allocate(size: number): number {
    const pointer = this.module.malloc(size);
    if (!pointer) throw new Error("Could not allocate Zstandard buffer");
    return pointer;
  }

  private check(result: number): number {
    if (this.module.ZSTD_isError(result)) {
      const pointer = this.module.ZSTD_getErrorName(result);
      const bytes = new Uint8Array(this.module.memory.buffer);
      const message = new TextDecoder().decode(bytes.subarray(pointer, bytes.indexOf(0, pointer)));
      throw new Error(`Zstandard codec error: ${message}`);
    }
    return result;
  }

  private step(size: number, position: number, isEnding = false): number {
    const z = this.module;
    const view = new DataView(z.memory.buffer);
    view.setUint32(this.inputPosition, position, true);
    view.setUint32(this.outputPosition, 0, true);
    const args = [
      this.context,
      this.output,
      ZSTD_CHUNK_SIZE,
      this.outputPosition,
      this.input,
      size,
      this.inputPosition,
    ] as const;
    return this.check(
      this.isDecompressing
        ? z.ZSTD_decompressStream_simpleArgs(...args)
        : z.ZSTD_compressStream2_simpleArgs(...args, isEnding ? 2 : 0),
    );
  }

  *transformChunk(chunk: Uint8Array): Generator<Uint8Array, void, unknown> {
    for (let offset = 0; offset < chunk.length; offset += ZSTD_CHUNK_SIZE) {
      if (this.isFinished) throw new Error("Unexpected bytes after the Zstandard frame");
      const part = chunk.subarray(offset, offset + ZSTD_CHUNK_SIZE);
      new Uint8Array(this.module.memory.buffer).set(part, this.input);
      yield* this.transformPart(part.length);
    }
  }

  private *transformPart(size: number): Generator<Uint8Array, void, unknown> {
    let position = 0;
    let produced: number;
    let remaining: number;
    do {
      remaining = this.step(size, position);
      const view = new DataView(this.module.memory.buffer);
      const consumed = view.getUint32(this.inputPosition, true);
      produced = view.getUint32(this.outputPosition, true);
      if (consumed === position && produced === 0 && position < size) {
        throw new Error("Zstandard codec made no progress");
      }
      position = consumed;
      if (this.isDecompressing && remaining === 0) {
        this.isFinished = true;
        if (position !== size) throw new Error("Unexpected bytes after the Zstandard frame");
      }
      if (produced) yield this.copyOutput(produced);
    } while (
      !this.isFinished &&
      (position < size || (produced === ZSTD_CHUNK_SIZE && remaining > 0))
    );
  }

  *finish(): Generator<Uint8Array, void, unknown> {
    if (this.isDecompressing) {
      if (!this.isFinished) throw new Error("Incomplete Zstandard frame");
      return;
    }
    let remaining: number;
    do {
      remaining = this.step(0, 0, true);
      const produced = new DataView(this.module.memory.buffer).getUint32(this.outputPosition, true);
      if (remaining > 0 && produced === 0) throw new Error("Zstandard codec made no progress");
      if (produced) yield this.copyOutput(produced);
    } while (remaining > 0);
    this.isFinished = true;
  }

  private copyOutput(size: number): Uint8Array<ArrayBuffer> {
    return new Uint8Array(this.module.memory.buffer).slice(this.output, this.output + size);
  }

  dispose(): void {
    if (this.context) {
      if (this.isDecompressing) this.module.ZSTD_freeDCtx(this.context);
      else this.module.ZSTD_freeCCtx(this.context);
      this.context = 0;
    }
    for (const pointer of [this.input, this.output, this.inputPosition, this.outputPosition]) {
      if (pointer) this.module.free(pointer);
    }
    this.input = 0;
    this.output = 0;
    this.inputPosition = 0;
    this.outputPosition = 0;
  }
}
