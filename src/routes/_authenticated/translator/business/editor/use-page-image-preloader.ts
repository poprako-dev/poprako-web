import { useEffect, useState } from "react";
import type { Page, PageImageQuality } from "@/routes/_authenticated/business/page/page";

const PAGE_IMAGE_PRELOAD_CONCURRENCY = 4;

type ResolvePageImage = (pageId: string, quality: PageImageQuality) => Promise<string>;

type PreloadJob = {
  pageId: string;
  quality: PageImageQuality;
};

type PreloaderConfig = {
  pageIds: string[];
  centerIndex: number;
  quality: PageImageQuality;
};

type PreloaderDeps = {
  resolvePageImage: ResolvePageImage;
  loadImage?: ((url: string) => Promise<void>) | undefined;
  concurrency?: number | undefined;
  onError?: ((job: PreloadJob, error: unknown) => void) | undefined;
};

type Args = {
  pages: Page[];
  currentPageIndex: number;
  quality: PageImageQuality;
  onLoadPageImage: ResolvePageImage;
};

export function centerOutPageIndexes(pageCount: number, centerIndex: number): number[] {
  if (pageCount <= 0 || centerIndex < 0 || centerIndex >= pageCount) return [];

  const indexes = [centerIndex];
  for (let distance = 1; indexes.length < pageCount; distance++) {
    const nextIndex = centerIndex + distance;
    const previousIndex = centerIndex - distance;

    if (nextIndex < pageCount) indexes.push(nextIndex);
    if (previousIndex >= 0) indexes.push(previousIndex);
  }

  return indexes;
}

export function resolveInitialPageIndex(
  pages: Pick<Page, "id">[],
  startPageId?: string,
  startPageIndex?: number,
): number {
  if (startPageId) {
    const pageIndex = pages.findIndex((page) => page.id === startPageId);
    if (pageIndex !== -1) return pageIndex;
  }

  if (startPageIndex !== undefined && startPageIndex >= 0 && startPageIndex < pages.length) {
    return startPageIndex;
  }

  return 0;
}

export function loadBrowserImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => {
      resolve();
    });
    image.addEventListener("error", () => {
      reject(new Error(`Failed to preload image: ${url}`));
    });
    image.src = url;
  });
}

export class PageImagePreloader {
  private resolvePageImage: ResolvePageImage;
  private readonly loadImage: (url: string) => Promise<void>;
  private readonly concurrency: number;
  private readonly onError: (job: PreloadJob, error: unknown) => void;
  private readonly startedJobs = new Set<string>();
  private readonly triggeredUrls = new Set<string>();
  private queue: PreloadJob[] = [];
  private activeCount = 0;
  private stopped = false;

  constructor({
    resolvePageImage,
    loadImage = loadBrowserImage,
    concurrency = PAGE_IMAGE_PRELOAD_CONCURRENCY,
    onError = (job, error) => {
      console.error("[BaseTranslator] 页面图片预加载失败", { ...job, error });
    },
  }: PreloaderDeps) {
    this.resolvePageImage = resolvePageImage;
    this.loadImage = loadImage;
    this.concurrency = Math.max(1, concurrency);
    this.onError = onError;
  }

  private jobKey(job: PreloadJob): string {
    return `${job.quality}\0${job.pageId}`;
  }

  configure({ pageIds, centerIndex, quality }: PreloaderConfig): void {
    this.stopped = false;

    this.queue = centerOutPageIndexes(pageIds.length, centerIndex)
      .flatMap((index) => {
        const pageId = pageIds[index];
        return pageId === undefined ? [] : [{ pageId, quality }];
      })
      .filter((job) => !this.startedJobs.has(this.jobKey(job)));
    this.pump();
  }

  setResolver(resolvePageImage: ResolvePageImage): void {
    this.resolvePageImage = resolvePageImage;
  }

  private pump(): void {
    while (!this.stopped && this.activeCount < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job || this.startedJobs.has(this.jobKey(job))) continue;

      this.startedJobs.add(this.jobKey(job));
      this.activeCount++;
      void this.run(job);
    }
  }

  stop(): void {
    this.stopped = true;
    this.queue = [];
  }

  private async run(job: PreloadJob): Promise<void> {
    try {
      const url = await this.resolvePageImage(job.pageId, job.quality);
      if (!url || this.triggeredUrls.has(url)) return;

      this.triggeredUrls.add(url);
      await this.loadImage(url);
    } catch (error) {
      this.onError(job, error);
    } finally {
      this.activeCount--;
      this.pump();
    }
  }
}

export function usePageImagePreloader({
  pages,
  currentPageIndex,
  quality,
  onLoadPageImage,
}: Args): void {
  const [preloader] = useState(
    () =>
      new PageImagePreloader({
        resolvePageImage: onLoadPageImage,
      }),
  );

  useEffect(() => {
    preloader.setResolver(onLoadPageImage);
    preloader.configure({
      pageIds: pages.map((page) => page.id),
      centerIndex: currentPageIndex,
      quality,
    });
  }, [currentPageIndex, onLoadPageImage, pages, preloader, quality]);

  useEffect(
    () => () => {
      preloader.stop();
    },
    [preloader],
  );
}
