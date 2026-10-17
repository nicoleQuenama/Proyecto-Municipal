"use client";

import type { WorkingChange } from "./types";
import { useVersioning } from "./versioning-context";
import { DiffRow } from "./diff-row";

interface ChangesListProps {
  changes: WorkingChange[];
}

/** Paso 1: elegir qué cambios entran en la próxima versión (el «git add»). */
export function ChangesList({ changes }: ChangesListProps) {
  const { state, dispatch } = useVersioning();
  const stagedCount = changes.filter((change) => state.staged.includes(change.key)).length;

  if (changes.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-xs text-ink-dim">
        No hay cambios sin guardar. Edita el titular o agrega imágenes y videos para verlos aquí.
      </p>
    );
  }

  const setStaged = (keys: string[]) => dispatch({ type: "stage/set", keys });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-ink-dim">
        <span>{stagedCount} de {changes.length} añadidos</span>
        <span className="flex gap-1">
          <button
            type="button"
            onClick={() => setStaged(changes.map((change) => change.key))}
            disabled={stagedCount === changes.length}
            className="rounded-md px-2 py-1 hover:bg-hover hover:text-ink disabled:opacity-40"
          >
            Añadir todos
          </button>
          <button
            type="button"
            onClick={() => setStaged([])}
            disabled={stagedCount === 0}
            className="rounded-md px-2 py-1 hover:bg-hover hover:text-ink disabled:opacity-40"
          >
            Quitar todos
          </button>
        </span>
      </div>

      <ul className="flex flex-col gap-1">
        {changes.map((change) => (
          <DiffRow
            key={change.key}
            change={change}
            leading={
              <input
                type="checkbox"
                aria-label={`Añadir ${change.node} · ${change.property}`}
                checked={state.staged.includes(change.key)}
                onChange={() => dispatch({ type: "stage/toggle", key: change.key })}
                className="h-3.5 w-3.5 shrink-0 accent-accent"
              />
            }
          />
        ))}
      </ul>
    </div>
  );
}
