export type ReviewLoadProgress = {
  stage: "downloading" | "decoding" | "rendering";
  receivedBytes?: number;
  totalBytes?: number | null;
  filename?: string;
};
export type ReportReviewProgress = (progress: ReviewLoadProgress) => void;
export function reviewStageLabel(stage: ReviewLoadProgress["stage"]): string {
  switch (stage) {
    case "downloading":
      return "正在下载当前页预览";
    case "decoding":
      return "正在解码当前页预览";
    case "rendering":
      return "正在显示当前页预览";
  }
}
