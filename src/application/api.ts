import { createApiClient } from "@/api/client";
import { useAppStore } from "@/route/business/session/session-store";

const configuredBaseUrl: unknown = import.meta.env["VITE_API_BASE_URL"];
if (configuredBaseUrl !== undefined && typeof configuredBaseUrl !== "string") {
  throw new TypeError("VITE_API_BASE_URL must be a string");
}

export const applicationApi = createApiClient({
  baseUrl: configuredBaseUrl ?? "/api/v1",
  getAuthRevision: () => useAppStore.getState().generation,
  onUnauthorized: (credential, revision) => {
    const state = useAppStore.getState();
    if (state.accessToken === credential && state.generation === revision)
      state.setAccessToken(null);
  },
  getAccessToken: () => useAppStore.getState().accessToken,
});
