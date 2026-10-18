"use client";

import { useState } from "react";
import type { CodeLanguage } from "./file-ref";
import type { OutlineLine } from "./outline";

/** Lo que se escribe en el editor al pulsar una línea, según el lenguaje. `nested`: el CSS va dentro de un bloque `& { }`. */
const SNIPPETS: Record<CodeLanguage, (selector: string, nested: boolean) => string> = {
  css: (selector, nested) => `${nested ? "& " : ""}${selector} {\n  \n}\n`,
  typescript: (selector) => `api.query('${selector}')`,
  html: (selector) => selector,
};

interface HtmlOutlineProps {
  lines: OutlineLine[];
  language: CodeLanguage;
  /** El CSS de este archivo se escribe dentro de `& { }`. */
  nested: boolean;
  onInsert: (text: string) => void;
}

/**
 * El HTML de lo que se está editando, para saber qué se puede elegir sin adivinar selectores. Pulsar una
 * línea escribe su selector en el editor, donde está el cursor.
 */
export function HtmlOutline({ lines, language, nested, onInsert }: HtmlOutlineProps) {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-7 shrink-0 border-l border-line bg-panel text-[11px] text-ink-dim [writing-mode:vertical-rl] hover:text-ink"
      >
        Ver el HTML
      </button>
    );
  }

  return (
    <aside aria-label="HTML de este destino" className="flex w-72 shrink-0 flex-col border-l border-line bg-panel">
      <header className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className="text-xs font-medium text-ink">HTML de este destino</span>
        <button
          type="button"
          aria-label="Ocultar el HTML"
          onClick={() => setOpen(false)}
          className="ml-auto h-5 w-5 rounded text-ink-dim hover:bg-hover hover:text-ink"
        >
          ×
        </button>
      </header>

      <p className="px-3 py-2 text-[11px] leading-snug text-ink-dim">
        Pulsa una línea y se escribe su selector en el código.
      </p>

      <ul className="min-h-0 flex-1 overflow-auto px-1.5 pb-3 font-mono text-[11px] leading-5">
        {lines.map((line) => (
          <li key={line.id} style={{ paddingLeft: line.depth * 14 }}>
            {line.selector === null ? (
              <span className="block px-1.5 text-ink-dim/60">{line.code}</span>
            ) : (
              <button
                type="button"
                title={line.label}
                onClick={() => onInsert(SNIPPETS[language](line.selector!, nested))}
                className={`block w-full truncate rounded px-1.5 text-left hover:bg-accent/25 hover:text-ink ${
                  line.current ? "bg-accent/20 text-accent" : "text-ink-dim"
                }`}
              >
                {line.code}
                {line.current && <span className="ml-2 font-sans text-[10px]">← aquí</span>}
              </button>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
