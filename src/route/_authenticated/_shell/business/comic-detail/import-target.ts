import type {
  ImportChapterFormat,
  ImportChapterTarget,
} from "@/route/_authenticated/business/chapter/chapter-input";

export type ImportTargetOption = {
  value: ImportChapterTarget;
  label: string;
};

type ResolveArgs = {
  canTranslate: boolean;
  canProofread: boolean;
  format: ImportChapterFormat;
};

const TARGET_LABELS: Record<ImportChapterTarget, string> = {
  translation: "翻译",
  proofread: "校对",
  both: "翻译+校对",
};

const SINGLE_TARGET_TITLES: Record<Exclude<ImportChapterTarget, "both">, string> = {
  translation: "导入翻译",
  proofread: "导入校对",
};

function toOptions(values: ImportChapterTarget[]): ImportTargetOption[] {
  return values.map((value) => ({ value, label: TARGET_LABELS[value] }));
}

export function resolveImportTargets(args: ResolveArgs): ImportTargetOption[] {
  if (!args.canTranslate && !args.canProofread) return [];
  if (!args.canTranslate) return toOptions(["proofread"]);
  if (!args.canProofread) return toOptions(["translation"]);
  return args.format === "json"
    ? toOptions(["translation", "proofread", "both"])
    : toOptions(["translation", "proofread"]);
}

export function defaultImportTarget(options: ImportTargetOption[]): ImportChapterTarget {
  return options[0]?.value ?? "translation";
}

export function importDialogTitle(options: ImportTargetOption[]): string {
  const onlyOption = options.length === 1 ? options[0] : undefined;
  if (onlyOption && onlyOption.value !== "both") {
    return SINGLE_TARGET_TITLES[onlyOption.value];
  }
  return "导入翻校";
}
