export type ComicInfo = {
  id: string;

  title: string;
  author: string;
  description: string;

  creatorId: string;

  index: number;
  chapterCount: number;

  coverUrl: string;

  lastActiveAt: number;
  createdAt: number;
  updatedAt: number;
};

export type CreateComicArgs = {
  teamId: string;
  title: string;
  author?: string;
  description?: string;
};

export type CreateComicResult = { id: string };

export type UpdateComicArgs = {
  id: string;
  title?: string;
  author?: string;
  description?: string;
};
