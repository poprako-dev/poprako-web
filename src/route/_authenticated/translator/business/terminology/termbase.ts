export type TermbaseInfo = {
  id: string;

  teamId?: string | undefined;
  comicId?: string | undefined;

  name: string;
  description?: string | undefined;
  termCount: number;

  creatorId: string;
  createdAt: number;
  updatedAt: number;
};
