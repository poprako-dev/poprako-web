export type TermInfo = {
  id: string;
  termbaseId: string;

  source: string;
  targets: string[];
  comment?: string | undefined;

  creatorId: string;
  createdAt: number;
  updatedAt: number;
};
