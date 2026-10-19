export type ListTermsArgs = {
  termbaseId: string;
  fuzzySource?: string | undefined;
  offset: number;
  limit: number;
};

export type CreateTermArgs = {
  termbaseId: string;
  source: string;
  targets: string[];
  comment?: string | undefined;
};

export type UpdateTermArgs = {
  source: string;
  targets: string[];
  comment?: string | undefined;
};
