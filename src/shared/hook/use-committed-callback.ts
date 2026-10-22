import { useCallback, useLayoutEffect, useRef } from "react";

/** Stable event callback that uses values from the latest committed render. */
export function useCommittedCallback<Args extends unknown[], Result>(
  callback: (...args: Args) => Result,
): (...args: Args) => Result {
  const callbackRef = useRef(callback);
  useLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  return useCallback((...args: Args) => callbackRef.current(...args), []);
}
