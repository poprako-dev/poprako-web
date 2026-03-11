export type Page = {
  id: string;
  index: number;
  totalUnitCount: number;
  translatedUnitCount: number;
  proofreadUnitCount: number;
};

export type PageInfo = Page & {
  chapterId: string;
  imageUrl: string;
  createdAt: number;
  updatedAt: number;
};

export type PageCreationResult = { pageId: string; putUrl: string };

export type ReserveChapterPagesArgs = { chapterId: string; pageCount: number };
export type ReserveChapterPagesResult = { creations: PageCreationResult[] };

export type UpdatePageArgs = { id: string; isUploaded?: boolean };
