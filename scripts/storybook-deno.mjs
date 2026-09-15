import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  executeCommand,
  globToRegexp,
  JsPackageManager,
  JsPackageManagerFactory,
} from "storybook/internal/common";

function quoteArgument(value) {
  const escaped = value.replaceAll(/[$`"\\]/g, "\\$&");
  return '"' + escaped + '"';
}

// Storybook 10 has no Deno package-manager proxy. Keep this adapter in source so
// a clean `deno ci` preserves the development command's Deno-only environment.
export class DenoPackageManager extends JsPackageManager {
  type = "deno";

  getCommandName() {
    return "deno";
  }

  getRunCommand(command) {
    return `deno task ${quoteArgument(command)}`;
  }

  getInstallCommand(dependencies, isDev = false) {
    const packages = dependencies.map((name) => quoteArgument(`npm:${name}`)).join(" ");
    return `deno add ${isDev ? "--dev " : ""}${packages}`;
  }

  getPackageCommand(args) {
    return `deno task --eval ${quoteArgument(args.map(quoteArgument).join(" "))}`;
  }

  async getModulePackageJSON(name) {
    const path = join(this.primaryPackageJson.operationDir, "node_modules", name, "package.json");
    try {
      return JSON.parse(await readFile(path, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") {return null;}
      throw error;
    }
  }

  async getInstalledVersion(name) {
    return (await this.getModulePackageJSON(name))?.version ?? null;
  }

  async findInstallations(pattern = []) {
    const matchers = pattern.map((value) => globToRegexp(value));
    const names = Object.keys(this.getAllDependencies()).filter((name) =>
      matchers.length === 0 || matchers.some((matcher) => matcher.test(name)),
    );
    const packages = await Promise.all(names.map(async (name) => {
      const version = await this.getInstalledVersion(name);
      return [name, version ? [{ version }] : []];
    }));
    return {
      dependencies: Object.fromEntries(packages.filter(([, versions]) => versions.length > 0)),
      duplicatedDependencies: {},
      infoCommand: "deno info",
      dedupeCommand: "deno install",
    };
  }

  runDeno(args, options = {}) {
    return executeCommand({ cwd: this.cwd, ...options, command: Deno.execPath(), args });
  }

  runPackageCommand({ args = [], useRemotePkg = false, ...options }) {
    if (useRemotePkg) {
      return this.runDeno(["run", "-A", `npm:${args[0]}`, ...args.slice(1)], options);
    }
    return this.runDeno(["task", "--eval", args.map(quoteArgument).join(" ")], options);
  }

  runInternalCommand(command, args, cwd = this.cwd, stdio = "pipe") {
    if (command === "exec") {return this.runPackageCommand({ args, cwd, stdio });}
    if (command === "run") {return this.runDeno(["task", ...args], { cwd, stdio });}
    throw new Error(`Use the Deno CLI for package-manager operation: ${command}`);
  }

  runInstall() {
    return this.runDeno(["install"]);
  }

  runAddDeps(dependencies, isDev) {
    return this.runDeno([
      "add", ...(isDev ? ["--dev"] : []), ...dependencies.map((name) => `npm:${name}`),
    ]);
  }

  getRegistryURL() {
    return Promise.resolve(undefined);
  }

  runGetVersions() {
    throw new Error("Use deno outdated to check dependency updates");
  }

  getResolutions() {
    throw new Error("Configure dependency overrides in package.json for Deno");
  }
}

export function configureDenoPackageManager() {
  JsPackageManagerFactory.getPackageManager = (options = {}, cwd = Deno.cwd()) =>
    new DenoPackageManager({ ...options, cwd });
}

if (import.meta.main) {
  configureDenoPackageManager();
  await import("storybook/internal/bin/dispatcher");
}
