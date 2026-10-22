export type ModuleSnapshot<Module> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; module: Module }
  | { status: "error"; error: unknown };

export interface ModuleResource<Module> {
  getSnapshot: () => ModuleSnapshot<Module>;
  subscribe: (listener: () => void) => () => void;
  load: () => Promise<Module>;
}

class SharedModule<Module> implements ModuleResource<Module> {
  private snapshot: ModuleSnapshot<Module> = { status: "idle" };
  private pending: Promise<Module> | null = null;
  private readonly listeners = new Set<() => void>();
  private readonly loader: () => Promise<Module>;

  constructor(loader: () => Promise<Module>) {
    this.loader = loader;
  }

  readonly getSnapshot = (): ModuleSnapshot<Module> => this.snapshot;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly load = (): Promise<Module> => {
    if (this.snapshot.status === "ready") return Promise.resolve(this.snapshot.module);
    if (this.pending) return this.pending;
    this.pending = Promise.resolve()
      .then(this.loader)
      .then(
        (module) => {
          this.publish({ status: "ready", module });
          return module;
        },
        (error: unknown) => {
          this.publish({ status: "error", error });
          throw error;
        },
      )
      .finally(() => {
        this.pending = null;
      });
    this.publish({ status: "loading" });
    return this.pending;
  };

  private publish(snapshot: ModuleSnapshot<Module>): void {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener();
  }
}

/** Module resources are shared by UI consumers and intent preloads, not by data requests. */
export function createModuleResource<Module>(
  loader: () => Promise<Module>,
): ModuleResource<Module> {
  return new SharedModule(loader);
}
