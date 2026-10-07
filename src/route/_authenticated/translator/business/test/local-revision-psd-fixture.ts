import type { EditorProps } from "../editor/editor-props";
import type { RevisionNote } from "../revision-note/revision-note";
import { openPsdPage } from "../revision-note/open-psd-page";
import { createStoryArgs } from "./base-translator-story-fixture";

type LocalPsd = { path: string; size: number };
const PREFIX = "/__revision-psd__";

async function readPage(file: LocalPsd, signal: AbortSignal): Promise<File> {
  const root = await navigator.storage.getDirectory();
  const directory = await root.getDirectoryHandle("storybook-revision-psd-rar-v1", {
    create: true,
  });
  const name = file.path.split("/").at(-1);
  if (!name) throw new Error("PSD 样本文件名无效");
  const handle = await directory.getFileHandle(name, { create: true });
  const existing = await handle.getFile();
  signal.throwIfAborted();
  if (existing.size === file.size) return existing;
  const response = await fetch(`${PREFIX}/${encodeURIComponent(name)}`, { signal });
  if (!response.ok || !response.body) throw new Error(`读取本地 PSD 失败：${name}`);
  await response.body.pipeTo(await handle.createWritable(), { signal });
  const result = await handle.getFile();
  if (result.size !== file.size) throw new Error(`PSD 样本不完整：${name}`);
  return result;
}

function notesForPage(pageId: string): RevisionNote[] {
  return Array.from({ length: 10 }, (_, index) => ({
    id: `${pageId}-note-${String(index)}`,
    number: index + 1,
    type: index % 2 === 0 ? "文字位置" : "断行",
    content: "示例批注：检查此区域的文字位置与断行。",
    layerId: null,
    rect: {
      xCoord: 0.1 + (index % 2) * 0.5,
      yCoord: 0.06 + Math.floor(index / 2) * 0.18,
      width: 0.25,
      height: 0.1,
    },
  }));
}

export async function createLocalRevisionPsdArgs(): Promise<EditorProps> {
  const response = await fetch(`${PREFIX}/manifest.json`);
  if (!response.ok) throw new Error("本地 PSD 样本未准备好，请先解压 test-resource/psd.rar");
  const files = (await response.json()) as LocalPsd[];
  if (files.length === 0) throw new Error("本地 PSD 样本为空");
  const base = createStoryArgs({ canTranslate: false, canProofread: false, units: [] });
  const template = base.project.pages[0];
  if (!template) throw new Error("缺少 Storybook 页面模板");
  return {
    ...base,
    project: {
      ...base.project,
      id: "local-revision-psd",
      pages: files.map((file, index) => ({ ...template, id: file.path, index })),
      pageCount: files.length,
    },
    startMode: "readOnly",
    startPageId: files[2]?.path ?? files[0]?.path,
    loadRevisionNotes: (pageId) => Promise.resolve(notesForPage(pageId)),
    loadRevisionPage: async (pageId, signal) => {
      const file = files.find((item) => item.path === pageId);
      if (!file) throw new Error(`找不到 PSD：${pageId}`);
      return openPsdPage(await readPage(file, signal), signal);
    },
  };
}
