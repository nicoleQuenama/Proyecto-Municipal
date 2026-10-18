"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { SearchIcon } from "../viewport/icons";
import { useCommands } from "./commands-context";
import { Kbd } from "./kbd";
import { Modal } from "../ui/modal";
import { usePalette } from "./use-palette";

export function CommandPalette() {
  const { dialog, closeDialog } = useCommands();
  if (dialog !== "palette") return null;

  return (
    <Modal label="Buscar comandos" onClose={closeDialog}>
      <PaletteContent />
    </Modal>
  );
}

function PaletteContent() {
  const { openDialog } = useCommands();
  const { query, setQuery, trail, step, rows, activeIndex, setIndex, error, choose, submit, back } = usePalette();
  const inputRef = useRef<HTMLInputElement>(null);
  const isPrompt = step?.kind === "prompt";

  // Al pasar de un paso a otro, el texto inicial (si lo hay) queda seleccionado para sobrescribirlo.
  useEffect(() => inputRef.current?.select(), [trail.length]);

  const move = (direction: 1 | -1) => setIndex(rows.length ? (activeIndex + direction + rows.length) % rows.length : 0);

  /** Qué hace cada tecla en la paleta. */
  const keyActions: Record<string, (e: KeyboardEvent) => void> = {
    ArrowDown: (e) => {
      e.preventDefault();
      move(1);
    },
    ArrowUp: (e) => {
      e.preventDefault();
      move(-1);
    },
    Enter: (e) => {
      e.preventDefault();
      if (isPrompt) submit();
      else choose(activeIndex);
    },
    Backspace: (e) => {
      if (query !== "" || trail.length === 0) return;
      e.preventDefault();
      back();
    },
  };
  const onKeyDown = (e: KeyboardEvent) => keyActions[e.key]?.(e);

  return (
    <div onKeyDown={onKeyDown}>
      <div className="flex items-center gap-3 border-b border-line px-4">
        <span className="text-ink-dim"><SearchIcon /></span>
        {trail.length > 0 && (
          <span className="shrink-0 rounded bg-accent/25 px-2 py-0.5 text-xs text-accent">
            {trail.map((item) => item.label).join(" › ")}
          </span>
        )}
        <input
          ref={inputRef}
          autoFocus
          role="combobox"
          aria-expanded={rows.length > 0}
          aria-controls="command-list"
          aria-invalid={error !== null}
          aria-activedescendant={rows[activeIndex] && `command-${rows[activeIndex].id}`}
          placeholder={step?.placeholder ?? "Busca, o escribe / para ver los comandos…"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-dim"
        />
      </div>

      {error && <p role="alert" className="border-b border-line px-4 py-2 text-xs text-red-400">{error}</p>}

      <ul id="command-list" role="listbox" className="max-h-80 overflow-y-auto p-2">
        {rows.map((row, position) => {
          const active = position === activeIndex;
          const startsGroup = row.group !== undefined && row.group !== rows[position - 1]?.group;

          return (
            <li key={row.id} role="presentation">
              {startsGroup && (
                <p className="px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-ink-dim uppercase">
                  {row.group}
                </p>
              )}
              <div
                id={`command-${row.id}`}
                role="option"
                aria-selected={active}
                onClick={() => choose(position)}
                onMouseMove={() => setIndex(position)}
                ref={(el) => {
                  if (active) el?.scrollIntoView({ block: "nearest" });
                }}
                className={`flex h-9 cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-[13px] ${
                  active ? "bg-accent/25" : ""
                }`}
              >
                <span className="min-w-0 truncate">{row.label}</span>
                {row.hint && <span className="ml-auto min-w-0 truncate text-xs text-ink-dim">{row.hint}</span>}
                {row.shortcut !== undefined && <Kbd combo={row.shortcut} />}
              </div>
            </li>
          );
        })}
        {!isPrompt && rows.length === 0 && (
          <li className="py-8 text-center text-[13px] text-ink-dim">Sin resultados</li>
        )}
        {isPrompt && <li className="px-2 py-3 text-xs text-ink-dim">Escribe y pulsa Enter para continuar.</li>}
      </ul>

      <div className="flex items-center justify-between border-t border-line px-4 py-2 text-xs text-ink-dim">
        <span>↑↓ navegar · Enter elegir · Retroceso vuelve · Esc cierra</span>
        <button
          type="button"
          onClick={() => openDialog("settings")}
          className="rounded-md px-2 py-1 hover:bg-hover hover:text-ink"
        >
          Configurar atajos
        </button>
      </div>
    </div>
  );
}
