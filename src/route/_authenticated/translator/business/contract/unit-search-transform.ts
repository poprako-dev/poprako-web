import type { UnitInfo } from "@/route/_authenticated/translator/business/unit/unit";
import type { Result } from "@/shared/utility/result";

export type UnitTextPart = "translatedText" | "proofreadText";

export type UnitSearchMatch = {
  pageId: string;
  unit: UnitInfo;
};

export type SearchUnitsArgs = {
  part: UnitTextPart;
  phrase: string;
};

export type TransformUnitsArgs = {
  part: UnitTextPart;
  origin: string;
  target: string;
  unitIds: string[];
};

export interface UnitSearchTransformDataSource {
  search: (args: SearchUnitsArgs) => Promise<Result<UnitSearchMatch[]>>;
  transform: (args: TransformUnitsArgs) => Promise<Result<void>>;
  reloadPage: (pageId: string) => Promise<Result<UnitInfo[]>>;
}
