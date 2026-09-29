import type { UnitInfo } from "@/route/_authenticated/translator/business/unit/unit";
import type { TranslatorMode } from "@/route/_authenticated/translator/business/unit/translator-mode";
import type { Project } from "@/route/_authenticated/translator/business/unit/project";
import type {
  PageImageQuality,
  PageUnitDiffStats,
  PageUnitFlaggedStats,
} from "@/route/_authenticated/business/page/page";
import type { SaveUnits } from "@/route/_authenticated/translator/business/contract/type";
import type { TerminologyDataSource } from "@/route/_authenticated/translator/business/contract/terminology";
import type { UnitSearchTransformDataSource } from "@/route/_authenticated/translator/business/contract/unit-search-transform";
import type { UnitUserResolver } from "@/route/_authenticated/translator/business/unit-list/unit-contributor-cache";
import type { TranslatorCompletionStage } from "@/route/_authenticated/translator/business/contract/access";

export type EditorProps = {
  project: Project;
  // 懒加载的 units 获取器，BaseTranslator 只负责在需要时调用它来获取 units 列表
  onLoadUnits: (pageId: string) => Promise<UnitInfo[]>;
  // 具体是否是 upsert 由实现决定，BaseTranslator 只负责传递修改后的 units 列表
  // BaseTranslator 为了减少 IO，采用内置 buffer 来缓存当前页的 units 的修改
  // onUpsertUnits 的默认调用时机是：翻页时、退出 BaseTranslator 时，
  // 以及一个手动的 "保存" 按钮被按下时
  onSaveUnits: SaveUnits;
  // 懒加载的图片 URL 获取器，BaseTranslator 只负责在需要时调用它来获取图片 URL
  onLoadPageImage: (pageId: string, quality: PageImageQuality) => Promise<string>;
  onResolveUser: UnitUserResolver;
  onCompleteStage: (stage: TranslatorCompletionStage) => Promise<void>;
  onListPageUnitDiffStats: () => Promise<PageUnitDiffStats[]>;
  onListPageUnitFlaggedStats: () => Promise<PageUnitFlaggedStats[]>;
  onExit: () => void;
  currentUserId: string;
  canTranslate: boolean;
  canProofread: boolean;
  terminology: TerminologyDataSource;
  unitSearchTransform: UnitSearchTransformDataSource;
  startPageId: string;
  startMode: TranslatorMode | "auto";
};
