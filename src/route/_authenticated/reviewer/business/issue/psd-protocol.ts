import type { ReviewLayer } from "./review-page";
export type PsdRequest = { id: number; type: "open"; file: Blob };
export type PsdResponse =
  | {
      id: number;
      type: "opened";
      width: number;
      height: number;
      layers: ReviewLayer[];
      image: ImageBitmap;
    }
  | { id: number; type: "error"; message: string };
