import { useCallback, useRef, useEffect } from "react";

export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: Parameters<T>): ReturnType<T> => {
    return callbackRef.current(...args);
  }, []) as T;
}

export default useStableCallback;
