import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { WorkflowTransition } from "@/route/_authenticated/business/chapter/chapter-input";

export function pickFallbackChapterId(chapters: ChapterInfo[]): string | null {
  if (chapters.length === 0) {
    return null;
  }

  const firstChapter = chapters[0];
  if (!firstChapter) {
    return null;
  }
  let fallbackChapter = firstChapter;
  for (const chapter of chapters.slice(1)) {
    if (chapter.index > fallbackChapter.index) {
      fallbackChapter = chapter;
    }
  }

  return fallbackChapter.id;
}

export function applyWorkflowTransition(
  chapter: ChapterInfo,
  transition: WorkflowTransition,
): ChapterInfo {
  const stageUpdates: Record<WorkflowTransition, { offset: number; nextPhase: number }> = {
    upload_complete: { offset: 0, nextPhase: 0b10 },
    upload_revert: { offset: 0, nextPhase: 0b00 },
    translate_start: { offset: 2, nextPhase: 0b01 },
    translate_complete: { offset: 2, nextPhase: 0b10 },
    translate_start_revert: { offset: 2, nextPhase: 0b00 },
    translate_revert: { offset: 2, nextPhase: 0b01 },
    proofread_start: { offset: 4, nextPhase: 0b01 },
    proofread_complete: { offset: 4, nextPhase: 0b10 },
    proofread_start_revert: { offset: 4, nextPhase: 0b00 },
    proofread_revert: { offset: 4, nextPhase: 0b01 },
    typeset_start: { offset: 6, nextPhase: 0b01 },
    typeset_complete: { offset: 6, nextPhase: 0b10 },
    typeset_start_revert: { offset: 6, nextPhase: 0b00 },
    typeset_revert: { offset: 6, nextPhase: 0b01 },
    review_complete: { offset: 8, nextPhase: 0b10 },
    review_revert: { offset: 8, nextPhase: 0b00 },
    publish_complete: { offset: 10, nextPhase: 0b10 },
  };
  const { offset, nextPhase } = stageUpdates[transition];

  return {
    ...chapter,
    stages: (chapter.stages & ~(0b11 << offset)) | (nextPhase << offset),
  };
}

export function getFileExtension(file: File): string | null {
  const dotIndex = file.name.lastIndexOf(".");
  if (dotIndex === -1 || dotIndex === file.name.length - 1) {
    return null;
  }
  return file.name.slice(dotIndex + 1).toLowerCase();
}

export function getUniformFileExtension(files: File[]): string | null {
  if (files.length === 0) {
    return null;
  }

  const firstFile = files[0];
  if (!firstFile) {
    return null;
  }
  const first = getFileExtension(firstFile) ?? "";
  const isUniform = files.every((file) => (getFileExtension(file) ?? "") === first);

  return isUniform ? first : null;
}
