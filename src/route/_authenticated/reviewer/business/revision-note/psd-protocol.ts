import type { RevisionLayer } from "./revision-page";
export type PsdRequest = { id: number; type: "open"; file: Blob };
export type PsdResponse =
  | {
      id: number;
      type: "opened";
      width: number;
      height: number;
      layers: RevisionLayer[];
      image: ImageBitmap;
    }
  | { id: number; type: "error"; message: string };
