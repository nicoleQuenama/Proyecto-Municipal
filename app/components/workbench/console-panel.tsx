"use client";

import { useEffect, useRef } from "react";
import type { ConsoleEntry, ConsoleLevel } from "../code/messages";

const LEVEL_STYLE: Record<ConsoleLevel, string> = {
  log: "text-neutral-200",
  info: "text-sky-300",
  warn: "text-amber-300",
  error: "text-red-400",
  debug: "text-violet-300",
};

const LEVEL_LABEL: Record<ConsoleLevel, string> = {
  log: "log",
  info: "info",
  warn: "warn",
  error: "error",
  debug: "debug",
};

/** La consola del código que se está viendo: sus console.log y sus errores, tal como los lanza el iframe. */
export function ConsolePanel({ entries, onClear }: { entries: ConsoleEntry[]; onClear: () => void }) {
  const end = useRef<HTMLDivElement>(null);
  const errors = entries.filter((entry) => entry.level === "error").length;

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [entries]);

  return (
    <section aria-label="Consola" className="flex h-44 shrink-0 flex-col border-t border-line bg-[#141414]">
      <header className="flex h-7 shrink-0 items-center gap-2 border-b border-line/70 px-3 text-[11px] text-ink-dim">
        <span className="font-semibold text-ink">Consola</span>
        {errors > 0 ? (
          <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-red-300">
            {errors} {errors === 1 ? "error" : "errores"}
          </span>
        ) : null}
        <span className="text-ink-dim/70">{entries.length} {entries.length === 1 ? "mensaje" : "mensajes"}</span>
        <button
          type="button"
          onClick={onClear}
          className="ml-auto rounded px-2 py-0.5 text-ink-dim hover:bg-hover hover:text-ink"
        >
          Limpiar
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto px-3 py-1 font-mono text-[11px] leading-relaxed">
        {entries.length === 0 ? (
          <p className="py-2 text-ink-dim/60">
            Sin mensajes. Los console.log, avisos y errores del código aparecen aquí.
          </p>
        ) : (
          entries.map((entry, index) => (
            <div key={`${entry.at}-${index}`} className="flex gap-2 border-b border-line/30 py-0.5 last:border-0">
              <span className={`shrink-0 uppercase ${LEVEL_STYLE[entry.level]}`}>{LEVEL_LABEL[entry.level]}</span>
              <span className={`whitespace-pre-wrap break-words ${entry.level === "error" ? "text-red-300" : "text-neutral-300"}`}>
                {entry.text}
              </span>
            </div>
          ))
        )}
        <div ref={end} />
      </div>
    </section>
  );
}
