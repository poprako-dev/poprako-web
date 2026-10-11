import type { ApiClient } from "@/api/client";
import { compareArtworkNames } from "@/route/_authenticated/business/artwork/artwork";
import { validateArtworkFiles } from "./artwork-upload";
import { ArtworkBatchRuntime } from "./artwork-batch-runtime";
import type { ArtworkBatch } from "./artwork-batch-types";

export function createArtworkBatch(args: {
  client: ApiClient;
  chapterId: string;
  files: readonly File[];
  includeArchive: boolean;
  targetId?: string;
  onChanged: () => void;
  onCompleted?: () => void;
}): ArtworkBatch {
  validateArtworkFiles(args.files);
  if (args.files.some((file) => !/\.psd$/iu.test(file.name))) {
    throw new Error("请选择 PSD 文件，系统会自动生成在线预览。");
  }
  const files = [...args.files].sort((a, b) => compareArtworkNames(a.name, b.name));
  return bindArtworkBatchRuntime(new ArtworkBatchRuntime(args, files));
}

function bindArtworkBatchRuntime(runtime: ArtworkBatchRuntime): ArtworkBatch {
  return {
    getSnapshot: runtime.getSnapshot.bind(runtime),
    subscribe: runtime.subscribe.bind(runtime),
    run: runtime.run.bind(runtime),
    cancel: runtime.cancel.bind(runtime),
    dispose: runtime.dispose.bind(runtime),
  };
}
