export type ListComicTermbasesArgs = {
  comicId: string;
  fuzzyName?: string | undefined;
  offset: number;
  limit: number;
};

export type RawListComicTermbasesArgs = {
  comic_id: string;
  fuzzy_name?: string | undefined;
  offset: number;
  limit: number;
};

export type CreateComicTermbaseArgs = {
  comicId: string;
  name: string;
  description?: string | undefined;
};

export type RawCreateComicTermbaseArgs = {
  comic_id: string;
  name: string;
  description?: string | undefined;
};

export type UpdateTermbaseArgs = {
  name: string;
  description?: string | undefined;
};

export type RawUpdateTermbaseArgs = {
  id: string;
  name: string;
  description?: string | undefined;
};
