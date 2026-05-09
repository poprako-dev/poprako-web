import type { UserInfo } from "./user";

export type Page = {
  id: string;

  chapterId: string;
  index: number;

  imageUrl: string;
  isUploaded: boolean;

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

export type PageCreationResult = { pageId: string; putUrl: string };

export type ReserveChapterPagesArgs = {
  chapterId: string;
  pageCount: number;
  fileExtension: string;
};
export type ReserveChapterPagesResult = { creations: PageCreationResult[] };

export type UpdatePageArgs = { id: string; isUploaded?: boolean };

export type PendingPage = { pageId: string; index: number };

export type UploadProgressCallbacks = {
  onPagesReserved: (pendingPages: PendingPage[]) => void;
  onPageUploaded: (pageId: string, file: File) => void;
};
