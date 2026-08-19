export type ListTermsArgs = {
  termbaseId: string;
  fuzzySource?: string;
  offset: number;
  limit: number;
};

export type RawListTermsArgs = {
  termbase_id: string;
  fuzzy_source?: string;
  offset: number;
  limit: number;
};

export type CreateTermArgs = {
  termbaseId: string;
  source: string;
  targets: string[];
  comment?: string;
};

export type RawCreateTermArgs = {
  termbase_id: string;
  source: string;
  targets: string[];
  comment?: string;
};

export type UpdateTermArgs = {
  source: string;
  targets: string[];
  comment?: string;
};

export type RawUpdateTermArgs = {
  id: string;
  source: string;
  targets: string[];
  comment?: string;
};
