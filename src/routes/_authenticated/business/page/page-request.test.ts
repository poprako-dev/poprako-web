import { afterEach, describe, expect, test, vi } from "vitest";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { uploadToPresignedUrl } from "@/routes/_authenticated/business/page/page-request";

class MockXmlHttpRequest {
  status = 422;
  responseText = JSON.stringify({ message: "对象存储校验消息" });
  timeout = 0;
  upload: { onprogress: ((event: ProgressEvent) => void) | null } = {
    onprogress: null,
  };
  onload: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  open(): void {
    return;
  }

  setRequestHeader(): void {
    return;
  }

  send(): void {
    this.onload?.();
  }

  abort(): void {
    this.onabort?.();
  }
}

describe("page upload API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    useToastStore.getState().hideToast();
  });

  test("reports a presigned PUT 422 response message", async () => {
    vi.stubGlobal("XMLHttpRequest", MockXmlHttpRequest);
    const showToast = vi.spyOn(useToastStore.getState(), "showToast");

    const result = await uploadToPresignedUrl(
      "https://upload.example/image",
      new File(["image"], "image.png", { type: "image/png" }),
    );

    expect(result).toEqual({
      success: false,
      error: "对象存储校验消息",
      httpStatus: 422,
      failureKind: "http",
    });
    expect(showToast).toHaveBeenCalledOnce();
    expect(showToast).toHaveBeenCalledWith("对象存储校验消息", "error");
  });
});

// A signal can be cancelled before XHR has registered its event handlers.
test("settles immediately when the upload signal is already aborted", async () => {
  vi.stubGlobal("XMLHttpRequest", MockXmlHttpRequest);
  const controller = new AbortController();
  controller.abort();
  try {
    await expect(
      uploadToPresignedUrl(
        "https://upload.example/artwork",
        new File(["xz"], "artwork.tar.xz"),
        {},
        undefined,
        controller.signal,
      ),
    ).resolves.toEqual({ success: false, error: "上传已取消", failureKind: "aborted" });
  } finally {
    vi.unstubAllGlobals();
  }
});
