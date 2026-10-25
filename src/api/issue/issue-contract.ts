export type IssueRect = { xCoord: number; yCoord: number; width: number; height: number };
export type IssueInput = {
  variant: string;
  rect: IssueRect | null;
  note: string;
};
export type IssueResponse = IssueInput & { id: string; pageArtworkId: string; index: number };
export type ImportChapterIssuesRequest = {
  pages: { pageArtworkId: string; issues: IssueInput[] }[];
};
export type ImportChapterIssuesResult = { importedPageCount: number; importedIssueCount: number };

export type PageIssuesResponse = {
  pageArtworkId: string;
  reviewKey: string;
  revision: string;
  chapterRevision: string;
  imageVersion: number | null;
  issues: IssueResponse[];
};
export type SavePageIssuesRequest = {
  reviewKey: string;
  revision: string;
  imageVersion: number | null;
  issues: (IssueInput & ({ id: string; localId?: never } | { localId: string; id?: never }))[];
};
export type CreatedIssueId = { localId: string; issueId: string };
export type SavePageIssuesResponse = {
  page: PageIssuesResponse;
  createdIssueIds: CreatedIssueId[];
};
export type IssueVariantsResponse = {
  reviewKey: string;
  revision: string;
  variants: { variant: string; count: number }[];
};
export type RenameIssueVariantRequest = {
  reviewKey: string;
  revision: string;
  from: string;
  to: string;
};
export type RenameIssueVariantResponse = {
  summary: IssueVariantsResponse;
  pages: PageIssuesResponse[];
};
