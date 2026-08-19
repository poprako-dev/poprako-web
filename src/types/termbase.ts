export type TermbaseInfo = {
  id: string;

  teamId?: string;
  comicId?: string;

  name: string;
  description?: string;
  termCount: number;

  creatorId: string;
  createdAt: number;
  updatedAt: number;
};
