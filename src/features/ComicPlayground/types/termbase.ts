export type ListComicTermbasesArgs = {
  comicId: string;
  fuzzyName?: string;
  offset: number;
  limit: number;
};

export type RawListComicTermbasesArgs = {
  comic_id: string;
  fuzzy_name?: string;
  offset: number;
  limit: number;
};

export type CreateComicTermbaseArgs = {
  comicId: string;
  name: string;
  description?: string;
};

export type RawCreateComicTermbaseArgs = {
  comic_id: string;
  name: string;
  description?: string;
};

export type UpdateTermbaseArgs = {
  name: string;
  description?: string;
};

export type RawUpdateTermbaseArgs = {
  id: string;
  name: string;
  description?: string;
};
