"use client";

import type { ReactNode } from "react";
import { ConsoleSinkProvider } from "../code/console-sink";
import { ConsolePanel } from "./console-panel";
import { useConsoleEntries } from "./use-console-entries";

/** Recoge lo que escribe en su consola todo el código que corre dentro del editor y lo muestra debajo. */
export function ConsoleHost({ children }: { children: ReactNode }) {
  const { entries, push, clear } = useConsoleEntries();
  return (
    <ConsoleSinkProvider value={push}>
      {children}
      <ConsolePanel entries={entries} onClear={clear} />
    </ConsoleSinkProvider>
  );
}
