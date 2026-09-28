export type AppConfig = {
  apiBaseUrl: string;
};

export const appConfig: AppConfig = {
  // Vite's ambient env index signature is any; this is the typed config boundary.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  apiBaseUrl: import.meta.env["VITE_API_BASE_URL"] ?? "/api/v1",
};
