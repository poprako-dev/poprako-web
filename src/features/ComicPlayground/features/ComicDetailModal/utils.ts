import type { ChapterInfo } from "@/types";
import type { WorkflowTransition } from "@/features/ComicPlayground/types/chapter";

export function pickFallbackChapterId(chapters: ChapterInfo[]): string | null {
  if (chapters.length === 0) return null;

  const fallbackChapter = chapters.reduce((currentHighest, chapter) => {
    return chapter.index > currentHighest.index ? chapter : currentHighest;
  });

  return fallbackChapter.id;
}

export function applyWorkflowTransition(
  chapter: ChapterInfo,
  transition: WorkflowTransition,
): ChapterInfo {
  const now = Date.now();

  switch (transition) {
    case "upload_complete":
      return {
        ...chapter,
        uploadedAt: chapter.uploadedAt ?? now,
      };
    case "translate_start":
      return {
        ...chapter,
        translatingAt: now,
        translatedAt: undefined,
      };
    case "translate_complete":
      return {
        ...chapter,
        translatingAt: undefined,
        translatedAt: now,
      };
    case "proofread_start":
      return {
        ...chapter,
        proofreadingAt: now,
        proofreadAt: undefined,
      };
    case "proofread_complete":
      return {
        ...chapter,
        proofreadingAt: undefined,
        proofreadAt: now,
      };
    case "typeset_start":
      return {
        ...chapter,
        typesettingAt: now,
        typesetAt: undefined,
      };
    case "typeset_complete":
      return {
        ...chapter,
        typesettingAt: undefined,
        typesetAt: now,
      };
    case "review_complete":
      return {
        ...chapter,
        reviewedAt: now,
      };
    case "publish_complete":
      return {
        ...chapter,
        publishedAt: now,
      };
    default:
      return chapter;
  }
}

export function getFileExtension(file: File): string | null {
  const dotIndex = file.name.lastIndexOf(".");
  if (dotIndex < 0 || dotIndex === file.name.length - 1) return null;
  return file.name.slice(dotIndex + 1).toLowerCase();
}

export function getUniformFileExtension(files: File[]): string | null {
  if (files.length === 0) return null;

  const first = getFileExtension(files[0]) ?? "";
  const isUniform = files.every((file) => (getFileExtension(file) ?? "") === first);

  return isUniform ? first : null;
}
