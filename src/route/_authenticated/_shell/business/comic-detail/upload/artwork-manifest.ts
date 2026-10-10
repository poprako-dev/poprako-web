import type { ArtworkImageInput, PageArtwork } from "@/api/page-artwork/page-artwork-api";
export type PreparedComposite = { file: File; hash: string; name: string };
export type ManifestPlan = { pages: ArtworkImageInput[]; positions: number[] };
export function mergeArtworkManifest(
  existing: readonly PageArtwork[],
  incoming: readonly PreparedComposite[],
): ManifestPlan {
  const ordered = [...existing].sort((a, b) => a.index - b.index);
  const pages: ArtworkImageInput[] = ordered.map((page) => {
    if (!page.imageHash || !page.ext) throw new Error("已有成稿缺少图片信息，请先修复后重试。");
    return {
      pageArtworkId: page.id,
      rawIdent: page.rawIdent,
      imageHash: page.imageHash,
      ext: page.ext,
    };
  });
  const consumed = new Set<number>();
  const positions = incoming.map((image) => {
    const index = ordered.findIndex(
      (page, index) => !consumed.has(index) && page.imageHash === image.hash && page.ext === "webp",
    );
    const input: ArtworkImageInput = {
      rawIdent: image.name,
      imageHash: image.hash,
      ext: "webp",
      newByteLen: image.file.size,
    };
    if (index >= 0) {
      consumed.add(index);
      const existing = ordered[index];
      if (!existing) throw new Error("成稿对应关系无效");
      pages[index] = { ...input, pageArtworkId: existing.id };
      return index;
    }
    pages.push(input);
    return pages.length - 1;
  });
  if (ordered.some((page, index) => !page.imageUploaded && !consumed.has(index))) {
    throw new Error("已有成稿尚未上传完成，请先通过卡片重传失败页面，再追加新成稿。");
  }
  return { pages, positions };
}
