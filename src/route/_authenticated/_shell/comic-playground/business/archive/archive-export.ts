import type { ApiClient } from "@/api/client";
import { exportComicArchives, type ComicArchives } from "@/api/comic/comic-archive";
import type { Result } from "@/shared/utility/result";
import { sanitizeExportFileName } from "@/route/_authenticated/_shell/business/comic-detail/export-download-utils";

export type ArchiveExport = { blob: Blob; name: string; count: number };
export type ExportArchives = (
  months: readonly string[] | undefined,
  signal: AbortSignal,
) => Promise<Result<ArchiveExport | null>>;

export async function packComicArchives(
  archives: ComicArchives,
  teamId: string,
  signal: AbortSignal,
): Promise<ArchiveExport | null> {
  signal.throwIfAborted();
  const entries = Object.entries(archives).sort(([left], [right]) => left.localeCompare(right));
  const count = entries.reduce((total, [, items]) => total + items.length, 0);
  if (count === 0) return null;
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const [month, items] of entries) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/u.test(month)) throw new Error("Invalid archive month");
    for (const [index, content] of items.entries()) {
      signal.throwIfAborted();
      zip.file(`${month}/${String(index + 1).padStart(4, "0")}.json`, content);
    }
  }
  const blob = await zip.generateAsync({ type: "blob" }, () => {
    signal.throwIfAborted();
  });
  signal.throwIfAborted();
  const date = new Date().toISOString().slice(0, 10);
  return { blob, name: `${sanitizeExportFileName(teamId)}-归档-${date}.zip`, count };
}

export async function prepareArchiveExport(
  client: ApiClient,
  teamId: string,
  months: readonly string[] | undefined,
  signal: AbortSignal,
): Promise<Result<ArchiveExport | null>> {
  const result = await exportComicArchives(client, teamId, months, signal);
  if (!result.success) return result;
  return { success: true, data: await packComicArchives(result.data, teamId, signal) };
}

export function downloadArchive(archive: ArchiveExport): void {
  const url = URL.createObjectURL(archive.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = archive.name;
  try {
    document.body.append(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }
}
