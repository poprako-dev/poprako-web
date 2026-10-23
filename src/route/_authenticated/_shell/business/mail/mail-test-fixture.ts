import { createApiClient } from "@/api/client";
import { useAppStore } from "@/route/business/session/session-store";

export const mail = {
  id: "mail-1",
  title: "更新",
  content: "内容",
  is_read: false,
  created_at: 1,
};

export function mailResponse(mails: unknown[]): Response {
  return Response.json({ code: 0, data: mails });
}

export function makeMailClient(fetchImpl: typeof fetch): ReturnType<typeof createApiClient> {
  return createApiClient({
    baseUrl: "https://example.test/api/v1",
    getAccessToken: () => useAppStore.getState().getAccessToken(),
    fetchImpl,
  });
}

export function pendingMailResponse(): {
  promise: Promise<Response>;
  finish: (response: Response) => void;
} {
  let finish: (response: Response) => void = () => {
    throw new Error("Deferred response has not initialized");
  };
  const promise = new Promise<Response>((resolve) => {
    finish = resolve;
  });
  return {
    promise,
    finish: (response: Response) => {
      finish(response);
    },
  };
}
