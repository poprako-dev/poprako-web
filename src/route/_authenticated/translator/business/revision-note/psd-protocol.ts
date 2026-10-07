import type { PageRect, RevisionLayer } from "./revision-page";
export type PsdRequest =
  | { id: number; type: "open"; file: Blob }
  | { id: number; type: "render"; layerId: string };
export type PsdResponse =
  | {
      id: number;
      type: "opened";
      width: number;
      height: number;
      layers: RevisionLayer[];
      image: Blob;
    }
  | { id: number; type: "rendered"; bounds: PageRect; image: Blob }
  | { id: number; type: "error"; message: string };
