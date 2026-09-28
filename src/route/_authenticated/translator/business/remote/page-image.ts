import type { Page, PageImageQuality } from "@/route/_authenticated/business/page/page";

export function selectPageImageUrl(
  page: Pick<Page, "imageUrl" | "imageOptimizedUrl">,
  quality: PageImageQuality,
): string {
  return quality === "original" ? page.imageUrl : (page.imageOptimizedUrl ?? page.imageUrl);
}
