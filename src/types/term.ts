export type TermInfo = {
  id: string;
  termbaseId: string;

  source: string;
  targets: string[];
  comment?: string;

  creatorId: string;
  createdAt: number;
  updatedAt: number;
};
