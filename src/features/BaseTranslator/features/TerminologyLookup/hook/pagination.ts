export type PaginationPhase =
  | "idle"
  | "initial-loading"
  | "loading-more"
  | "ready"
  | "error";

export type PaginationState<T extends { id: string }> = {
  items: T[];
  offset: number;
  hasMore: boolean;
  phase: PaginationPhase;
  error?: string;
  requestVersion: number;
};

export type PaginationAction<T extends { id: string }> =
  | { type: "reset"; requestVersion: number }
  | { type: "load-more"; requestVersion: number }
  | {
      type: "resolve";
      requestVersion: number;
      items: T[];
      pageSize: number;
      append: boolean;
    }
  | {
      type: "reject";
      requestVersion: number;
      error: string;
    };

export function initialPaginationState<T extends { id: string }>() {
  return {
    items: [],
    offset: 0,
    hasMore: true,
    phase: "idle",
    requestVersion: 0,
  } satisfies PaginationState<T>;
}

export function mergeUniqueItems<T extends { id: string }>(
  current: T[],
  incoming: T[],
) {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !seen.has(item.id))];
}

export function paginationReducer<T extends { id: string }>(
  state: PaginationState<T>,
  action: PaginationAction<T>,
): PaginationState<T> {
  if (action.type === "reset") {
    return {
      items: [],
      offset: 0,
      hasMore: true,
      phase: "initial-loading",
      requestVersion: action.requestVersion,
    };
  }

  if (action.requestVersion !== state.requestVersion) return state;

  if (action.type === "load-more") {
    return { ...state, phase: "loading-more", error: undefined };
  }

  if (action.type === "reject") {
    return { ...state, phase: "error", error: action.error };
  }

  const items = action.append
    ? mergeUniqueItems(state.items, action.items)
    : action.items;
  const offset = action.append
    ? state.offset + action.items.length
    : action.items.length;

  return {
    items,
    offset,
    hasMore: action.items.length === action.pageSize,
    phase: "ready",
    error: undefined,
    requestVersion: state.requestVersion,
  };
}
