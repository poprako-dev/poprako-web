export type ListComicTermbasesArgs = {
  comicId: string;
  fuzzyName?: string | undefined;
  offset: number;
  limit: number;
};

export type CreateComicTermbaseArgs = {
  comicId: string;
  name: string;
  description?: string | undefined;
};

export type UpdateTermbaseArgs = {
  name: string;
  description?: string | undefined;
};
