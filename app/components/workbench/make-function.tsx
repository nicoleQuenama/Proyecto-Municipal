"use client";

import { useState } from "react";
import type { FunctionScope } from "../site/types";

/** Cómo se llama cada alcance de una función reutilizable. Un alcance nuevo es una entrada nueva. */
export const SCOPE_LABELS: { [K in FunctionScope["kind"]]: string } = {
  global: "Todo el proyecto",
  block: "Solo esta sección",
  element: "Solo este elemento",
};

interface MakeFunctionProps {
  /** Dónde se puede usar la función nueva, según de dónde viene el código. */
  scopes: FunctionScope[];
  initialName: string;
  /** Posición bajo el final de lo seleccionado, dentro del editor. */
  position: { top: number; left: number };
  /** Devuelve el motivo si no se pudo crear. */
  onCreate: (scope: FunctionScope, name: string) => string | null;
}

/**
 * La opción que se superpone al seleccionar código: lo convierte en una función con nombre,
 * reutilizable en todo el proyecto, en una sección o en un elemento.
 */
export function MakeFunction({ scopes, initialName, position, onCreate }: MakeFunctionProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  const create = (scope: FunctionScope) => {
    const problem = onCreate(scope, name.trim());
    if (problem) setError(problem);
  };

  return (
    <div
      className="absolute z-30 w-72 rounded-lg border border-line bg-panel p-1.5 text-xs text-ink shadow-2xl"
      style={{ top: position.top, left: Math.max(8, position.left) }}
      // Pulsar aquí no debe quitar la selección del editor.
      onMouseDown={(e) => e.target instanceof HTMLInputElement || e.preventDefault()}
    >
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-hover"
        >
          <span aria-hidden className="font-serif text-sm italic text-accent">ƒ</span>
          Convertir en función reutilizable…
        </button>
      ) : (
        <div className="flex flex-col gap-1.5 p-1">
          <input
            autoFocus
            aria-label="Nombre de la función"
            aria-invalid={error !== null}
            placeholder="nombreDeLaFuncion"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            className="h-8 rounded-md border border-line bg-canvas px-2 font-mono text-xs outline-none focus:border-accent"
          />
          <p className="px-0.5 text-[11px] text-ink-dim">¿Dónde se podrá usar?</p>
          {scopes.map((scope) => (
            <button
              key={scope.kind}
              type="button"
              onClick={() => create(scope)}
              className="h-8 rounded-md bg-hover px-2 text-left hover:bg-accent hover:text-white"
            >
              {SCOPE_LABELS[scope.kind]}
            </button>
          ))}
          {error && <p role="alert" className="text-[11px] text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
