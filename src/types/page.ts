import type { UserInfo } from "./user";

export type Page = {
  id: string;

  chapterId: string;
  index: number;

  imageUrl: string;
  imageThumbnailUrl?: string;
  isUploaded: boolean;
  imageHash?: string;
  byteLength?: number;
  extension?: string;

  creatorId: string;
  creator?: UserInfo;

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
  pageId?: string;
  imageHash: string;
  byteLength: number;
  extension: string;
};

export type PageImageUpload = {
  putUrl: string;
  imageVersion: number;
  headers: Record<string, string>;
};

export type ReservedPage = {
  pageId: string;
  index: number;
  imageHash: string;
  byteLength: number;
  extension: string;
  upload: PageImageUpload | null;
};

export type ReserveChapterPagesArgs = {
  chapterId: string;
  pages: PageImageInput[];
};
export type ReserveChapterPagesResult = { pages: ReservedPage[] };

export type UpdatePageArgs = {
  id: string;
  isUploaded?: boolean;
  imageVersion?: number;
};

export type PendingPage = { pageId: string; index: number; fileIndex: number };

export type UploadProgressCallbacks = {
  onPagesReserved: (pendingPages: PendingPage[]) => void;
  onPageUploaded: (pageId: string, file: File) => void;
  onPageUploadProgress?: (pageId: string, percent: number) => void;
};
