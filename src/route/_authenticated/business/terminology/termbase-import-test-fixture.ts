import { vi } from "vitest";
import type { Mock } from "vitest";

export const importContent = JSON.stringify({
  name: "文件中的名称",
  description: "文件中的描述",
  terms: [{ source: "団長", targets: ["团长", "队长"], comment: null }],
});

export const importedTermbase = {
  id: "imported-base",
  created: true,
  createdTermCount: 1,
  mergedTermCount: 0,
};

type ImportFile = {
  file: File;
  read: Mock<() => Promise<string>>;
};

export function createImportFile(name = "terms.json", content = importContent): ImportFile {
  const file = new File([content], name, { type: "application/json" });
  const read = vi.fn<() => Promise<string>>().mockResolvedValue(content);
  Object.defineProperty(file, "text", { value: read });
  return { file, read };
}
