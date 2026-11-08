"use client";

import { useCallback, useState } from "react";
import type { ConsoleEntry } from "../code/messages";

/** Los mensajes de consola que se conservan: los más antiguos se descartan. */
const MAX_ENTRIES = 300;

/** Lo que el código del usuario ha escrito en su consola mientras el editor está abierto. */
export function useConsoleEntries() {
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const push = useCallback((entry: ConsoleEntry) => setEntries((current) => [...current.slice(1 - MAX_ENTRIES), entry]), []);
  const clear = useCallback(() => setEntries([]), []);
  return { entries, push, clear };
}
