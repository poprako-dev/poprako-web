import { createContext, use } from "react";
import type { ApiClient } from "@/api/client";

export type ApplicationContext = { api: ApiClient };

export const ApiContext = createContext<ApiClient | null>(null);

export function useApiClient(): ApiClient {
  const client = use(ApiContext);
  if (!client) {
    throw new Error("API provider is missing from the application or test assembly");
  }
  return client;
}
