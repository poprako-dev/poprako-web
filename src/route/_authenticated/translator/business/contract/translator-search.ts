import type { TranslatorMode } from "../unit/translator-mode";
import {
  parseWorkbenchSearch,
  workbenchReturnDestination,
} from "@/route/_authenticated/business/navigation/workbench-navigation";
import type { WorkbenchSearch } from "@/route/_authenticated/business/navigation/workbench-navigation";
export const parseTranslatorSearch = parseWorkbenchSearch;
export function translatorStartMode(search: WorkbenchSearch): TranslatorMode | "auto" {
  return search.readOnly === "true" ? "readOnly" : "auto";
}
export function translatorReturnDestination(
  search: WorkbenchSearch,
): ReturnType<typeof workbenchReturnDestination> {
  return workbenchReturnDestination(search, "translator");
}
