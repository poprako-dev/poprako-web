import { validateFiles } from "@/routes/_authenticated/_shell/utilities/business/archive";

export type BoundedImage = {
  id: string;
  file: File;
  limitKiB: string | null;
};

// Numeric, case-insensitive filename ordering, as in Windows Explorer.
const filenameOrder = new Intl.Collator("zh-CN", {
  numeric: true,
  sensitivity: "base",
});

export function sortImages(items: readonly BoundedImage[]): BoundedImage[] {
  // Keep compatibility with the ES2022 target.
  return [...items].sort(
    (a, b) =>
      filenameOrder.compare(a.file.name, b.file.name) ||
      a.file.name.localeCompare(b.file.name, "zh-CN"),
  );
}

export function webpName(name: string): string {
  return name.replace(/\.[^.]+$/u, "") + ".webp";
}

export function limitBytes(value: string): number | null {
  const bytes = Number(value) * 1024;
  return Number.isSafeInteger(bytes) && bytes >= 1024 ? bytes : null;
}

export function imageLimit(item: BoundedImage, index: number, body: string, cover: string): string {
  return item.limitKiB ?? (index === 0 ? cover : body);
}

export function validateImages(items: readonly BoundedImage[]): string | null {
  const error = validateFiles(
    items.map((item) => item.file),
    "compress",
  );
  if (error) return error;
  const names = new Set<string>();
  for (const { file } of items) {
    if (!/\.(?:jpe?g|png|webp|bmp)$/iu.test(file.name)) {
      return `不支持的图片：${file.name}，请选择 JPG、PNG、WebP 或 BMP`;
    }
    if (/[/\\:*?"<>|]/u.test(file.name)) {
      return `文件名含不支持的字符：${file.name}`;
    }
    const name = webpName(file.name).normalize("NFC").toLowerCase();
    if (names.has(name)) return `转换后存在同名文件：${name}，请重命名后再选择`;
    names.add(name);
  }
  return null;
}
