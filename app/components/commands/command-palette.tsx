"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { SearchIcon } from "../viewport/icons";
import { useCommands } from "./commands-context";
import { Kbd } from "./kbd";
import { Modal } from "../ui/modal";

/** Minúsculas y sin tildes, para que "angulo" encuentre "Ángulo". */
const normalize = (text: string) =>
  text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

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
  const { commands, closeDialog, openDialog } = useCommands();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);

  const results = useMemo(() => {
    const needle = normalize(query.trim());
    return commands.filter((c) => normalize(`${c.label} ${c.group}`).includes(needle));
  }, [commands, query]);

  const activeIndex = Math.min(index, results.length - 1);

  const runCommand = (position: number) => {
    const command = results[position];
    if (!command) return;
    closeDialog();
    command.run();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setIndex(results.length ? (activeIndex + 1) % results.length : 0);
        break;
      case "ArrowUp":
        e.preventDefault();
        setIndex(results.length ? (activeIndex - 1 + results.length) % results.length : 0);
        break;
      case "Enter":
        e.preventDefault();
        runCommand(activeIndex);
        break;
    }
  };

  return (
    <div onKeyDown={onKeyDown}>
      <div className="flex items-center gap-3 border-b border-line px-4">
        <span className="text-ink-dim"><SearchIcon /></span>
        <input
          autoFocus
          role="combobox"
          aria-expanded
          aria-controls="command-list"
          aria-activedescendant={results[activeIndex] && `command-${results[activeIndex].id}`}
          placeholder="Busca una herramienta, vista o acción…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-dim"
        />
      </div>

      <ul id="command-list" role="listbox" className="max-h-80 overflow-y-auto p-2">
        {results.map((command, position) => {
          const active = position === activeIndex;
          const startsGroup = command.group !== results[position - 1]?.group;

          return (
            <li key={command.id} role="presentation">
              {startsGroup && (
                <p className="px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-ink-dim uppercase">
                  {command.group}
                </p>
              )}
              <div
                id={`command-${command.id}`}
                role="option"
                aria-selected={active}
                onClick={() => runCommand(position)}
                onMouseMove={() => setIndex(position)}
                ref={(el) => {
                  if (active) el?.scrollIntoView({ block: "nearest" });
                }}
                className={`flex h-9 cursor-pointer items-center justify-between rounded-md px-2 text-[13px] ${
                  active ? "bg-accent/25" : ""
                }`}
              >
                {command.label}
                <Kbd combo={command.shortcut} />
              </div>
            </li>
          );
        })}
        {results.length === 0 && (
          <li className="py-8 text-center text-[13px] text-ink-dim">Sin resultados</li>
        )}
      </ul>

      <div className="flex items-center justify-between border-t border-line px-4 py-2 text-xs text-ink-dim">
        <span>↑↓ navegar · Enter ejecutar · Esc cerrar</span>
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
