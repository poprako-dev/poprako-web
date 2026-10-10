import type { ApiClient } from "@/api/client";
import { allocArtwork, markArtworkUploaded } from "@/api/chapter/artwork-api";
import type { ArtworkAllocation } from "@/api/chapter/artwork-api";
import { prepareArtwork } from "./artwork-upload";
import type { PreparedArtwork } from "./artwork-upload";
import type { ArtworkTask } from "./artwork-batch-types";
import type { Result } from "@/shared/utility/result";
import { toApiRequestError } from "@/route/business/request-error";

type ArchiveArgs = { client: ApiClient; chapterId: string; files: File[]; enabled: boolean };
interface ArchivePorts {
  patch: (id: string, change: Partial<ArtworkTask>) => void;
  write: <T>(request: () => Promise<Result<T>>) => Promise<T>;
  check: () => void;
  fail: (id: string, error: unknown) => void;
  changed: () => void;
  signal: () => AbortSignal;
}

export class ArtworkBatchArchive {
  private readonly args: ArchiveArgs;
  private readonly ports: ArchivePorts;
  private prepared: PreparedArtwork | null = null;
  private version: number | null = null;
  private putDone = false;
  private completed = false;

  constructor(args: ArchiveArgs, ports: ArchivePorts) {
    this.args = args;
    this.ports = ports;
  }

  get done(): boolean {
    return this.completed;
  }

  async prepare(): Promise<void> {
    if (!this.args.enabled || this.prepared || this.completed) return;
    try {
      await this.packFiles();
    } catch (error) {
      this.ports.fail("archive", error);
    }
  }

  private async packFiles(): Promise<void> {
    this.ports.patch("archive", { phase: "packing", progress: 0, error: null });
    const total = this.args.files.reduce((sum, file) => sum + file.size, 0);
    this.prepared = await prepareArtwork(this.args.files, this.ports.signal(), (progress) => {
      this.ports.patch("archive", {
        progress: Math.min(99, (progress.processedBytes / Math.max(total, 1)) * 100),
      });
    });
    this.ports.check();
    this.ports.patch("archive", { phase: "prepared", progress: null });
  }

  async upload(): Promise<void> {
    if (!this.args.enabled || this.completed || !this.prepared) return;
    try {
      this.ports.check();
      if (!this.putDone) {
        await this.allocateAndPut();
        this.putDone = true;
        this.ports.check();
      }
      await this.confirm();
    } catch (error) {
      this.ports.fail("archive", error);
    }
  }

  private async allocateAndPut(): Promise<void> {
    const prepared = this.prepared;
    if (!prepared) return;
    this.ports.patch("archive", { phase: "allocating", progress: null, error: null });
    const allocation = await this.ports.write<ArtworkAllocation>(() =>
      allocArtwork(
        this.args.client,
        this.args.chapterId,
        prepared.hash,
        prepared.file.size,
        this.ports.signal(),
      ),
    );
    this.version = allocation.artworkVersion;
    this.ports.check();
    if (!allocation.slot) return;
    this.ports.patch("archive", { phase: "uploading", progress: 0 });
    await this.put(prepared, allocation.slot);
  }

  private async put(
    prepared: PreparedArtwork,
    slot: NonNullable<ArtworkAllocation["slot"]>,
  ): Promise<void> {
    const result = await this.args.client.putPresigned({
      url: slot.putUrl,
      headers: slot.headers,
      file: prepared.file,
      signal: this.ports.signal(),
      onProgress: (progress) => {
        this.ports.patch("archive", { progress });
      },
    });
    if (!result.success) throw toApiRequestError(result);
  }

  private async confirm(): Promise<void> {
    if (this.version === null) throw new Error("压缩包尚未分配");
    this.ports.patch("archive", { phase: "confirming", progress: null, error: null });
    const version = this.version;
    await this.ports.write(() =>
      markArtworkUploaded(this.args.client, this.args.chapterId, version, this.ports.signal()),
    );
    this.ports.check();
    this.completed = true;
    this.ports.patch("archive", { phase: "done", progress: 100 });
    this.ports.changed();
  }

  async dispose(): Promise<void> {
    await this.prepared?.dispose();
  }
}
