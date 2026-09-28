import type { ChapterInfo } from "@/routes/_authenticated/business/chapter/chapter";
import type { WorkflowTransition } from "@/routes/_authenticated/business/chapter/chapter-input";

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
  if (chapter.stages !== undefined) {
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

  const now = Date.now();
  switch (transition) {
    case "upload_complete": {
      return {
        ...chapter,
        uploadedAt: chapter.uploadedAt ?? now,
      };
    }
    case "translate_start": {
      return {
        ...chapter,
        translatingAt: now,
        translatedAt: undefined,
      };
    }
    case "translate_complete": {
      return {
        ...chapter,
        translatingAt: undefined,
        translatedAt: now,
      };
    }
    case "proofread_start": {
      return {
        ...chapter,
        proofreadingAt: now,
        proofreadAt: undefined,
      };
    }
    case "proofread_complete": {
      return {
        ...chapter,
        proofreadingAt: undefined,
        proofreadAt: now,
      };
    }
    case "typeset_start": {
      return {
        ...chapter,
        typesettingAt: now,
        typesetAt: undefined,
      };
    }
    case "typeset_complete": {
      return {
        ...chapter,
        typesettingAt: undefined,
        typesetAt: now,
      };
    }
    case "review_complete": {
      return {
        ...chapter,
        reviewedAt: now,
      };
    }
    case "publish_complete": {
      return {
        ...chapter,
        publishedAt: now,
      };
    }
    case "upload_revert":
    case "translate_start_revert":
    case "translate_revert":
    case "proofread_start_revert":
    case "proofread_revert":
    case "typeset_start_revert":
    case "typeset_revert":
    case "review_revert": {
      return chapter;
    }
  }
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
