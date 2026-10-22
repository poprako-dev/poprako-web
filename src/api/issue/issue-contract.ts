export type IssueRect = { xCoord: number; yCoord: number; width: number; height: number };
export type IssueInput = {
  variant: string;
  layerName: string | null;
  rect: IssueRect | null;
  note: string;
};
export type IssueResponse = IssueInput & { id: string; pageArtworkId: string; index: number };
export type ImportChapterIssuesRequest = {
  pages: { pageArtworkId: string; issues: IssueInput[] }[];
};
export type ImportChapterIssuesResult = { importedPageCount: number; importedIssueCount: number };
