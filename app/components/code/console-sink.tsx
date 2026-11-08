"use client";

import { createContext, useContext } from "react";
import type { ConsoleEntry, ConsoleLevel } from "./messages";
import { formatConsoleValues } from "./format-console";

/** A dónde va lo que el código del usuario escribe en su consola. Solo existe dentro del editor de código. */
export type ConsoleSink = (entry: ConsoleEntry) => void;

const ConsoleSinkContext = createContext<ConsoleSink | null>(null);

export const ConsoleSinkProvider = ConsoleSinkContext.Provider;

/** La consola del editor de código, o `null` fuera de él (en el lienzo no se recoge nada). */
export const useConsoleSink = () => useContext(ConsoleSinkContext);

/** Una consola como la del navegador (`log`, `warn`…) que escribe en el destino dado. */
export function makeConsole(sink: ConsoleSink | null, source: string): Record<ConsoleLevel, (...values: unknown[]) => void> {
  const write = (level: ConsoleLevel) => (...values: unknown[]) => {
    // También va a la consola real del navegador, por si se prefiere inspeccionar allí los objetos.
    console[level](...values);
    sink?.({ level, text: formatConsoleValues(values), at: Date.now(), source });
  };
  return { log: write("log"), info: write("info"), warn: write("warn"), error: write("error"), debug: write("debug") };
}
