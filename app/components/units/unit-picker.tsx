"use client";

import { useMemo, useRef, useState } from "react";
import { TopLayer } from "../ui/top-layer";
import { useDismiss } from "../ui/use-dismiss";
import { getUnitColor } from "./unit-colors";
import type { UnitName } from "./use-unit-names";

interface UnitPickerProps {
  /** Las unidades entre las que se puede elegir (las suyas, o todas si administra). */
  units: UnitName[];
  /** `null` = global; `undefined` = todavía sin elegir. */
  value: string | null | undefined;
  onChange: (unitId: string | null) => void;
  /** Ofrece «Global» entre las opciones. */
  allowGlobal: boolean;
  /** Etiqueta accesible del campo. */
  label: string;
}

function Option({
  unitId,
  name,
  selected,
  onPick,
}: {
  unitId: string | null;
  name: string;
  selected: boolean;
  onPick: (unitId: string | null) => void;
}) {
  const color = getUnitColor(unitId);
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => onPick(unitId)}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-hover cursor-pointer ${selected ? "text-accent" : "text-ink"}`}
    >
      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color.border }} />
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {selected && (
        <span aria-hidden="true" className="shrink-0 text-[10px] font-bold">
          ✓
        </span>
      )}
    </button>
  );
}

/** Elegir para quién es algo (un archivo, un destino…): se busca entre muchas unidades sin hacer la lista eterna. */
export function UnitPicker({ units, value, onChange, allowGlobal, label }: UnitPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  const selected =
    value === undefined
      ? undefined
      : value === null
        ? { id: null as string | null, name: "Global" }
        : units.find((unit) => unit.id === value);
  const term = query.trim().toLowerCase();
  const matches = useMemo(
    () => units.filter((unit) => unit.name.toLowerCase().includes(term)),
    [units, term],
  );

  const pick = (unitId: string | null) => {
    onChange(unitId);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={ref} className="relative flex flex-col gap-1">
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex h-9 items-center justify-between gap-2 rounded-lg border px-3 text-xs outline-none focus:border-accent cursor-pointer ${
          selected ? "border-line bg-canvas text-ink" : "border-dashed border-accent/50 bg-accent/5 text-ink-dim"
        }`}
      >
        {selected ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: getUnitColor(value).border }}
            />
            <span className="truncate">{selected.name}</span>
          </span>
        ) : (
          <span>Elige para quién…</span>
        )}
        <span aria-hidden="true" className="shrink-0 text-ink-dim">
          ▾
        </span>
      </button>

      {open && (
        <TopLayer anchorRef={button} side="bottom-end" className="w-64 rounded-lg border border-line bg-panel p-1 text-ink shadow-2xl">
          <input
            autoFocus
            aria-label="Buscar unidad"
            placeholder="Buscar unidad…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mb-1 h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs outline-none placeholder:text-ink-dim focus:border-accent"
          />
          <ul role="listbox" aria-label={label} className="max-h-64 overflow-y-auto">
            {allowGlobal && (
              <li role="none">
                <Option unitId={null} name="Global (todo el equipo)" selected={value === null} onPick={pick} />
              </li>
            )}
            {matches.map((unit) => (
              <li key={unit.id} role="none">
                <Option unitId={unit.id} name={unit.name} selected={value === unit.id} onPick={pick} />
              </li>
            ))}
          </ul>
          {matches.length === 0 && (
            <p className="px-2 py-3 text-center text-[11px] text-ink-dim">No hay unidades con ese nombre.</p>
          )}
        </TopLayer>
      )}
    </div>
  );
}
