"use client";

import { Modal } from "../ui/modal";
import { DataRowView } from "./data-row";
import type { DataTarget } from "./data-target";
import { useCodeData } from "./use-code-data";

interface DataModalProps {
  target: DataTarget;
  onClose: () => void;
}

/** El contenido del bloque o de la página: los arreglos y objetos de su código, editables sin abrir el código. */
export function DataModal({ target, onClose }: DataModalProps) {
  const { sets, change, places } = useCodeData(target);

  return (
    <Modal label="Contenido del bloque" onClose={onClose}>
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-4 text-ink">
        <header>
          <h2 className="text-sm font-semibold">Contenido</h2>
          <p className="text-[11px] text-ink-dim">
            Lo que cambies aquí se escribe en el código del bloque.
            {places > 0 && ` Se aplica a ${places} ${places === 1 ? "lugar" : "lugares"}.`}
          </p>
        </header>

        {sets.map((set, setIndex) => (
          <section key={set.name} aria-label={set.name} className="flex flex-col gap-2">
            <h3 className="font-mono text-xs text-accent">{set.name}</h3>
            <ul className="flex flex-col gap-2">
              {set.rows.map((row, index) => (
                <DataRowView
                  key={index}
                  setName={set.name}
                  index={index}
                  row={row}
                  list={set.kind === "list"}
                  count={set.rows.length}
                  onSet={(key, value) => void change({ type: "set", set: setIndex, row: index, key, value })}
                  onRemove={() => void change({ type: "remove-row", set: setIndex, row: index })}
                  onMove={(to) => void change({ type: "move-row", set: setIndex, row: index, to })}
                />
              ))}
            </ul>
            {set.kind === "list" && (
              <button
                type="button"
                onClick={() => void change({ type: "add-row", set: setIndex })}
                className="h-8 self-start rounded-md bg-hover px-3 text-xs text-ink-dim hover:text-ink cursor-pointer"
              >
                + Agregar elemento
              </button>
            )}
          </section>
        ))}

        <button type="button" onClick={onClose} className="h-8 self-end rounded-md bg-accent/25 px-4 text-xs text-accent cursor-pointer">
          Listo
        </button>
      </div>
    </Modal>
  );
}
