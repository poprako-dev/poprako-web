import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  executeCommand,
  globToRegexp,
  JsPackageManager,
  JsPackageManagerFactory,
} from "storybook/internal/common";

/** @param {string} value */
function quoteArgument(value) {
  const escaped = value.replaceAll(/[$`"\\]/g, "\\$&");
  return '"' + escaped + '"';
}

// Storybook 10 has no Deno package-manager proxy. Keep this adapter in source so
// a clean `deno ci` preserves the development command's Deno-only environment.
export class DenoPackageManager extends JsPackageManager {
  type = /** @type {import("storybook/internal/common").PackageManagerName} */ (
    /** @type {unknown} */ ("deno")
  );

  getCommandName() {
    return "deno";
  }

  /** @override @param {string} command */
  getRunCommand(command) {
    return `deno task ${quoteArgument(command)}`;
  }

  /** @override @param {string[]} dependencies @param {boolean} [isDev=false] */
  getInstallCommand(dependencies, isDev = false) {
    const packages = dependencies.map((name) => quoteArgument(`npm:${name}`)).join(" ");
    return `deno add ${isDev ? "--dev " : ""}${packages}`;
  }

  /** @override @param {string[]} args */
  getPackageCommand(args) {
    return `deno task --eval ${quoteArgument(args.map(quoteArgument).join(" "))}`;
  }

  /** @override @param {string} name @returns {Promise<import("storybook/internal/common").PackageJson|null>} */
  async getModulePackageJSON(name) {
    const path = join(this.primaryPackageJson.operationDir, "node_modules", name, "package.json");
    try {
      return JSON.parse(await readFile(path, "utf8"));
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  /** @override @param {string} name */
  async getInstalledVersion(name) {
    return (await this.getModulePackageJSON(name))?.version ?? null;
  }

  /** @override @param {string[]} [pattern=[]] */
  async findInstallations(pattern = []) {
    const matchers = pattern.map((value) => globToRegexp(value));
    const names = Object.keys(this.getAllDependencies()).filter(
      (name) => matchers.length === 0 || matchers.some((matcher) => matcher.test(name)),
    );
    const packages = await Promise.all(
      names.map(async (name) => {
        const version = await this.getInstalledVersion(name);
        return [name, version ? [{ version }] : []];
      }),
    );
    return {
      dependencies: Object.fromEntries(packages.filter(([, versions]) => versions.length > 0)),
      duplicatedDependencies: {},
      infoCommand: "deno info",
      dedupeCommand: "deno install",
    };
  }

  /**
   * @param {string[]} args
   * @param {Omit<import("storybook/internal/common").ExecuteCommandOptions, "command">} [options]
   */
  runDeno(args, options = {}) {
    return executeCommand({ cwd: this.cwd, ...options, command: Deno.execPath(), args });
  }

  /**
   * @override
   * @param {Omit<import("storybook/internal/common").ExecuteCommandOptions, "command"> & {args: string[]; useRemotePkg?: boolean}} options
   */
  runPackageCommand({ args, useRemotePkg = false, ...options }) {
    if (useRemotePkg) {
      return this.runDeno(["run", "-A", `npm:${args[0]}`, ...args.slice(1)], options);
    }
    return this.runDeno(["task", "--eval", args.map(quoteArgument).join(" ")], options);
  }

  /**
   * @override
   * @param {string} command
   * @param {string[]} args
   * @param {string} [cwd]
   * @param {"inherit"|"pipe"|"ignore"} [stdio]
   */
  runInternalCommand(command, args, cwd = this.cwd, stdio = "pipe") {
    if (command === "exec") {
      return this.runPackageCommand({ args, cwd, stdio });
    }
    if (command === "run") {
      return this.runDeno(["task", ...args], { cwd, stdio });
    }
    throw new Error(`Use the Deno CLI for package-manager operation: ${command}`);
  }

  /** @override @param {{force?: boolean}} [options] */
  runInstall(options = {}) {
    void options;
    return this.runDeno(["install"]);
  }

  /**
   * @override
   * @param {string[]} dependencies
   * @param {boolean} isDev
   * @param {boolean} [writeOutputToFile]
   */
  runAddDeps(dependencies, isDev, writeOutputToFile) {
    void writeOutputToFile;
    return this.runDeno([
      "add",
      ...(isDev ? ["--dev"] : []),
      ...dependencies.map((name) => `npm:${name}`),
    ]);
  }

  /** @override */
  getRegistryURL() {
    return Promise.resolve(undefined);
  }

  /**
   * @override
   * @template {boolean} T
   * @param {string} packageName
   * @param {T} fetchAllVersions
   * @returns {Promise<T extends true ? string[] : string>}
   */
  async runGetVersions(packageName, fetchAllVersions) {
    void packageName;
    void fetchAllVersions;
    throw new Error("Use deno outdated to check dependency updates");
  }

  /**
   * @override
   * @param {import("storybook/internal/common").PackageJson} packageJson
   * @param {Record<string, string>} versions
   * @returns {Record<string, any>}
   */
  getResolutions(packageJson, versions) {
    void packageJson;
    void versions;
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
