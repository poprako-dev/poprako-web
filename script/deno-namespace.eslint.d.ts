declare namespace Deno {
  function execPath(): string;
  let exitCode: number;

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
