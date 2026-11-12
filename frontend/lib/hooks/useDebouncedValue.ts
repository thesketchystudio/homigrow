// lib/hooks/useDebouncedValue.ts
// Returns `value` only after it has stopped changing for `delayMs`, so a
// search box can drive a server query without one request per keystroke.

import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
