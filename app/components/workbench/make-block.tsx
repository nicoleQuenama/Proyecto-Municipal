"use client";

import { useState } from "react";
import type { BlockKind } from "../site/code-kind-rules";

export type BlockChoice = "component" | "section-template" | "page-template";

/** Qué es cada opción: cómo se llama, cómo se explica, y qué acción de la página la crea. Una opción nueva es una entrada nueva. */
export const CHOICES: Record<BlockChoice, { label: string; hint: string; kind: Exclude<BlockKind, "loose">; scope: "section" | "page" }> = {
  component: {
    label: "Componente",
    hint: "Una sola definición: si cambia, cambia en todos los lugares donde se use.",
    kind: "component",
    scope: "section",
  },
  "section-template": {
    label: "Plantilla de sección",
    hint: "Un molde de bloque: sale en Plantillas › Secciones y cada copia tiene su propio código.",
    kind: "template",
    scope: "section",
  },
  "page-template": {
    label: "Plantilla de página",
    hint: "Guarda una copia como molde de página: sale en Plantillas › Páginas. El código se queda aquí.",
    kind: "template",
    scope: "page",
  },
};

interface MakeBlockProps {
  initialName: string;
  /** La plantilla de página solo tiene sentido con el código de una página. */
  pageCode: boolean;
  /** Devuelve el motivo si no se pudo crear. */
  onCreate: (choice: BlockChoice, name: string) => string | null;
}

/**
 * La opción que se superpone al seleccionar código, junto a «Convertir en función»: lo guarda como componente
 * (compartido) o como plantilla (de sección o de página).
 */
export function MakeBlock({ initialName, pageCode, onCreate }: MakeBlockProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const choices = (Object.keys(CHOICES) as BlockChoice[]).filter((choice) => pageCode || choice !== "page-template");

  const create = (choice: BlockChoice) => {
    if (!name.trim()) return setError("Ponle un nombre.");
    const problem = onCreate(choice, name.trim());
    if (problem) setError(problem);
  };

  return (
    <div className="rounded-lg border border-line bg-panel p-1.5 text-xs text-ink shadow-2xl">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-hover cursor-pointer"
        >
          <span aria-hidden className="text-sm text-accent">▣</span>
          Convertir en componente o plantilla…
        </button>
      ) : (
        <div className="flex flex-col gap-1.5 p-1">
          <input
            autoFocus
            aria-label="Nombre del bloque"
            aria-invalid={error !== null}
            placeholder="Nombre, p. ej. Header"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            className="h-8 rounded-md border border-line bg-canvas px-2 text-xs outline-none focus:border-accent"
          />
          {choices.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => create(choice)}
              className="rounded-md bg-hover px-2 py-1.5 text-left hover:bg-accent hover:text-white cursor-pointer"
            >
              <span className="block font-medium">{CHOICES[choice].label}</span>
              <span className="block text-[11px] opacity-80">{CHOICES[choice].hint}</span>
            </button>
          ))}
          {error && <p role="alert" className="text-[11px] text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
