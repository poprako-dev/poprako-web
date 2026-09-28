declare namespace Deno {
  type DirEntry = {
    name: string;
    isDirectory: boolean;
    isFile: boolean;
  };

  const args: string[];
  function execPath(): string;
  let exitCode: number;
  function test(name: string, fn: () => void | Promise<void>): void;
  function readDir(path: string): AsyncIterable<DirEntry>;
  function readTextFile(path: string | URL): Promise<string>;
  function writeTextFile(path: string | URL, data: string): Promise<void>;
  function realPathSync(path: string | URL): string;

  function readDirSync(path: string): {
    name: string;
    isDirectory: boolean;
    isFile: boolean;
  }[];
  function readTextFileSync(path: string): string;
  function statSync(path: string): { isFile: boolean };

  class Command {
    constructor(
      command: string,
      options: {
        args: string[];
        cwd: URL;
        stdout: "piped";
        stderr: "piped";
      },
    );
    spawn(): {
      kill(signal: "SIGTERM"): void;
      status: Promise<{ success: boolean; code: number }>;
      stdout: ReadableStream<Uint8Array>;
      stderr: ReadableStream<Uint8Array>;
    };
  }
}
