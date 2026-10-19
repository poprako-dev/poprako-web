export const archiveTools = [
  { id: "compress", label: "打包并压缩" },
  { id: "extract", label: "解压并解包" },
  { id: "bounded", label: "定界压缩" },
] as const;
export type UtilityMode = (typeof archiveTools)[number]["id"] | "termbases";
