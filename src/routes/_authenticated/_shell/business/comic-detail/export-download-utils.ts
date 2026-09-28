export function sanitizeExportFileName(value: string): string {
  const normalized = value
    .replaceAll(/[<>:"/\\|?*]/gu, "_")
    .split("")
    .map((character) => (character.charCodeAt(0) < 32 ? "_" : character))
    .join("")
    .trim()
    .slice(0, 120);
  return normalized || "chapter-export";
}

export function waitForExportRetry(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function getImageExtensionFromContentType(contentType: string | null): string | null {
  switch (contentType?.split(";", 1)[0]?.trim().toLowerCase() ?? null) {
    case null:
      return null;
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    case "image/bmp":
      return "bmp";
    case "image/tiff":
      return "tiff";
    default:
      return null;
  }
}

export function getImageExtensionFromUrl(imageUrl: string): string | null {
  try {
    const pathname = new URL(imageUrl).pathname;
    return /\.([a-zA-Z0-9]+)$/.exec(pathname)?.[1]?.toLowerCase() ?? null;
  } catch {
    const normalized = imageUrl.split("?", 1)[0]?.split("#", 1)[0] ?? "";
    return /\.([a-zA-Z0-9]+)$/.exec(normalized)?.[1]?.toLowerCase() ?? null;
  }
}

export function appendDownloadCacheBuster(imageUrl: string): string {
  const cacheBuster = `${String(Date.now())}-${Math.random().toString(36).slice(2)}`;
  try {
    const url = new URL(imageUrl);
    url.searchParams.set("_download_bust", cacheBuster);
    return url.href;
  } catch {
    const hashIndex = imageUrl.indexOf("#");
    const base = hashIndex === -1 ? imageUrl : imageUrl.slice(0, hashIndex);
    const hash = hashIndex === -1 ? "" : imageUrl.slice(hashIndex);
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}_download_bust=${encodeURIComponent(cacheBuster)}${hash}`;
  }
}
