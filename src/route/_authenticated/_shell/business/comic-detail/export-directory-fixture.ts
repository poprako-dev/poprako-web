import { vi } from "vitest";

export function createDirectoryFixture(): {
  handle: FileSystemDirectoryHandle;
  files: Map<string, Blob | string>;
  directories: Set<string>;
  write: ReturnType<typeof vi.fn<(path: string, data: Blob | string) => Promise<void>>>;
  close: ReturnType<typeof vi.fn<() => Promise<void>>>;
  abort: ReturnType<typeof vi.fn<() => Promise<void>>>;
} {
  const files = new Map<string, Blob | string>();
  const directories = new Set<string>();
  const write = vi.fn<(path: string, data: Blob | string) => Promise<void>>().mockResolvedValue();
  const close = vi.fn<() => Promise<void>>().mockResolvedValue();
  const abort = vi.fn<() => Promise<void>>().mockResolvedValue();
  const handle = createHandle("", { files, directories, write, close, abort });
  return { handle, files, directories, write, close, abort };
}

type State = Omit<ReturnType<typeof createDirectoryFixture>, "handle">;

function createHandle(prefix: string, state: State): FileSystemDirectoryHandle {
  return {
    getDirectoryHandle: (name: string, options?: FileSystemGetDirectoryOptions) => {
      const path = `${prefix}${name}`;
      if (state.files.has(path)) throw new DOMException("File exists", "TypeMismatchError");
      if (!state.directories.has(path) && !options?.create)
        throw new DOMException("Missing directory", "NotFoundError");
      state.directories.add(path);
      return Promise.resolve(createHandle(`${path}/`, state));
    },
    getFileHandle: (name: string) => {
      const path = `${prefix}${name}`;
      return Promise.resolve({
        createWritable: () => {
          let pending: Blob | string = "";
          return Promise.resolve({
            write: async (data: Blob | string) => {
              await state.write(path, data);
              pending = data;
            },
            close: async () => {
              await state.close();
              state.files.set(path, pending);
            },
            abort: state.abort,
          });
        },
      });
    },
  } as unknown as FileSystemDirectoryHandle;
}
