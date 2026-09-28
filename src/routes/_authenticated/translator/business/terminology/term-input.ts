export type ListTermsArgs = {
  termbaseId: string;
  fuzzySource?: string | undefined;
  offset: number;
  limit: number;
};

export type RawListTermsArgs = {
  termbase_id: string;
  fuzzy_source?: string | undefined;
  offset: number;
  limit: number;
};

export type CreateTermArgs = {
  termbaseId: string;
  source: string;
  targets: string[];
  comment?: string | undefined;
};

export type RawCreateTermArgs = {
  termbase_id: string;
  source: string;
  targets: string[];
  comment?: string | undefined;
};

export type UpdateTermArgs = {
  source: string;
  targets: string[];
  comment?: string | undefined;
};

export type RawUpdateTermArgs = {
  id: string;
  source: string;
  targets: string[];
  comment?: string | undefined;
};
