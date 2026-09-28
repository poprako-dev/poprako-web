import type { UserInfo } from "@/routes/business/identity/user";
import type { ImageUploadSlot } from "@/routes/business/identity/image";

export type PageImageQuality = "optimized" | "original";

export type PageUnitFlaggedStats = {
  pageId: string;
  index: number;
  flaggedUnitCount: number;
};

export type PageUnitDiffStats = {
  pageId: string;
  index: number;
  translatedUnitCount: number;
  editedUnitCount: number;
  proofreaderAppendUnitCount: number;
};

export type Page = {
  id: string;

  chapterId: string;
  index: number;

  imageUrl: string;
  imageOptimizedUrl?: string | undefined;
  imageThumbnailUrl?: string | undefined;
  isUploaded: boolean;
  imageHash?: string | undefined;
  newByteLen?: number | undefined;
  extension?: string | undefined;

  creatorId: string;
  creator?: UserInfo | undefined;

  totalUnitCount: number;
  translatedUnitCount: number;
  proofreadUnitCount: number;

  createdAt: number;
  updatedAt: number;
};

export type PageInfo = Page & {
  chapterId: string;
  imageUrl: string;
  createdAt: number;
  updatedAt: number;
};

export type PageImageInput = {
  pageId?: string | undefined;
  rawIdent?: string | undefined;
  imageHash: string;
  newByteLen?: number | undefined;
  extension: string;
};

export type PageImageUpload = ImageUploadSlot;

export type AllocatedPage = {
  pageId: string;
  index: number;
  imageHash: string;
  extension: string;
  slot: PageImageUpload | null;
};

export type AllocChapterPagesArgs = {
  chapterId: string;
  pages: PageImageInput[];
};
export type AllocChapterPagesResult = { pages: AllocatedPage[] };

export type PendingPage = { pageId: string; index: number; fileIndex: number };

export type UploadProgressCallbacks = {
  onPagesAllocated: (pendingPages: PendingPage[]) => void;
  onPageUploaded: (pageId: string, file: File) => void;
  onPageUploadProgress?: ((pageId: string, percent: number) => void) | undefined;
};
