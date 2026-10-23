"use client";

import { useState } from "react";
import { CodeLine } from "./code-line";
import type { CodeLanguage } from "./file-ref";
import type { OutlineLine } from "./outline";

/** Lo que se escribe en el editor al pulsar una línea, según el lenguaje. `nested`: el CSS va dentro de un bloque `& { }`. */
const SNIPPETS: Record<CodeLanguage, (selector: string, nested: boolean) => string> = {
  css: (selector, nested) => `${nested ? "& " : ""}${selector} {\n  \n}\n`,
  typescript: (selector) => `api.query('${selector}')`,
  html: (selector) => selector,
};

/** Qué pasa al pulsar, dicho en palabras, según el lenguaje. */
const ACTION_HINT: Record<CodeLanguage, string> = {
  css: "escribe una regla de CSS para esa etiqueta",
  typescript: "escribe el código que la busca",
  html: "escribe su selector",
};

interface HtmlOutlineProps {
  lines: OutlineLine[];
  language: CodeLanguage;
  /** El CSS de este archivo se escribe dentro de `& { }`. */
  nested: boolean;
  onInsert: (text: string) => void;
}

/**
 * El HTML de lo que se está editando, en claro y con colores, para elegir una etiqueta sin adivinar selectores.
 * Pulsar una etiqueta escribe en el editor, donde está el cursor; al pasar el ratón se ve qué se escribirá.
 */
export function HtmlOutline({ lines, language, nested, onInsert }: HtmlOutlineProps) {
  const [open, setOpen] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-8 shrink-0 border-l border-neutral-300 bg-neutral-100 text-xs font-medium text-neutral-600 [writing-mode:vertical-rl] hover:bg-neutral-200"
      >
        Ver las etiquetas HTML
      </button>
    );
  }

  const preview = hovered === null ? null : SNIPPETS[language](hovered, nested).trim();

  return (
    <aside aria-label="HTML de este destino" className="flex w-80 shrink-0 flex-col border-l border-neutral-300 bg-neutral-50 text-neutral-800">
      <header className="flex items-center gap-2 border-b border-neutral-200 bg-white px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold">Etiquetas de este destino</p>
          <p className="text-[11px] leading-snug text-neutral-500">
            Haz clic en una etiqueta y se {ACTION_HINT[language]}, donde está tu cursor.
          </p>
        </div>
        <button
          type="button"
          aria-label="Ocultar las etiquetas"
          onClick={() => setOpen(false)}
          className="h-6 w-6 shrink-0 rounded text-neutral-500 hover:bg-neutral-200"
        >
          ×
        </button>
      </header>

      <ul className="min-h-0 flex-1 overflow-auto p-2 font-mono text-xs leading-5">
        {lines.map((line) => (
          <li key={line.id} style={{ paddingLeft: line.depth * 16 }}>
            {line.selector === null ? (
              <span className="block px-2 opacity-60">
                <CodeLine code={line.code} />
              </span>
            ) : (
              <button
                type="button"
                title={line.label}
                onClick={() => onInsert(SNIPPETS[language](line.selector!, nested))}
                onMouseEnter={() => setHovered(line.selector)}
                onMouseLeave={() => setHovered(null)}
                className={`group flex w-full items-center gap-2 rounded-md border px-2 text-left transition-colors ${
                  line.current
                    ? "border-sky-300 bg-sky-100"
                    : "border-transparent hover:border-sky-300 hover:bg-sky-50"
                }`}
              >
                <span className="min-w-0 flex-1 break-all">
                  <CodeLine code={line.code} />
                </span>
                {line.current ? (
                  <span className="shrink-0 rounded bg-sky-600 px-1.5 font-sans text-[10px] font-medium text-white">Estás aquí</span>
                ) : (
                  <span className="hidden shrink-0 rounded bg-sky-600 px-1.5 font-sans text-[10px] font-medium text-white group-hover:block">
                    + Insertar
                  </span>
                )}
              </button>
            )}
          </li>
        ))}
      </ul>

      <footer className="min-h-16 shrink-0 border-t border-neutral-200 bg-white px-3 py-2">
        <p className="mb-1 text-[11px] text-neutral-500">{preview ? "Se escribirá:" : "Pasa el ratón sobre una etiqueta para ver qué se escribe."}</p>
        {preview && <pre className="overflow-x-auto rounded bg-neutral-900 p-2 font-mono text-[11px] text-emerald-300">{preview}</pre>}
      </footer>
    </aside>
  );
}
