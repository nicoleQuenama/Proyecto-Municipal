"use client";

import { useMemo, useState } from "react";
import { IconGlyph } from "./icon-glyph";
import { iconTitle } from "./icon-labels";
import type { IconName } from "./icon-set";
import { searchIcons } from "./icon-search";

interface IconPickerProps {
  value: IconName;
  onPick: (name: IconName) => void;
  /** Si se da, solo se ofrecen estos íconos (sin buscador). */
  only?: IconName[];
  label?: string;
}

/** Selector visual de íconos: una cuadrícula con buscador por nombre en español. */
export function IconPicker({ value, onPick, only, label = "Ícono" }: IconPickerProps) {
  const [query, setQuery] = useState("");
  const names = useMemo(() => only ?? searchIcons(query), [only, query]);

  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      {!only && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ícono: menú, carrito, correo…"
          aria-label="Buscar ícono por nombre"
          className="h-7 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent"
        />
      )}
      <div className="grid max-h-44 grid-cols-6 gap-1 overflow-y-auto rounded-md border border-line p-1">
        {names.map((name) => (
          <button
            key={name}
            type="button"
            title={iconTitle(name)}
            aria-label={iconTitle(name)}
            aria-pressed={name === value}
            onClick={() => onPick(name)}
            className={`flex h-8 items-center justify-center rounded ${
              name === value ? "bg-accent text-white" : "text-ink-dim hover:bg-hover hover:text-ink"
            }`}
          >
            <IconGlyph name={name} size={18} />
          </button>
        ))}
        {names.length === 0 && <p className="col-span-6 py-2 text-center text-xs text-ink-dim">Ningún ícono se llama así.</p>}
      </div>
    </div>
  );
}
