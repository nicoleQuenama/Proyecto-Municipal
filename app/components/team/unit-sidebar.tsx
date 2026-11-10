"use client";

import { useState } from "react";
import type { Unit } from "../../server/units/unit-store";
import type { UnitDraft } from "../units/use-units-admin";

interface Props {
  units: Unit[];
  totalPeople: number;
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate: (draft: UnitDraft) => Promise<boolean>;
}

const item = "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm cursor-pointer";

/** Lista de unidades a la izquierda: elegir una filtra las personas y abre su configuración. */
export function UnitSidebar({ units, totalPeople, selectedId, onSelect, onCreate }: Props) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const shown = units.filter((unit) => unit.name.toLowerCase().includes(query.trim().toLowerCase()));
  const create = async () => {
    if (name.trim() && (await onCreate({ name, kind: "designer", ownerId: null, reviewRequired: false, overrides: [] }))) setName("");
  };
  const tone = (active: boolean) => (active ? "bg-accent/15 font-medium text-accent" : "text-ink hover:bg-hover");

  return (
    <aside aria-label="Unidades" className="flex w-72 shrink-0 flex-col gap-3 border-r border-line p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-dim">Unidades</p>
      <input aria-label="Buscar unidad" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar unidad…" className="h-10 rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent" />
      <nav className="-mx-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1">
        <button type="button" onClick={() => onSelect("")} className={`${item} ${tone(selectedId === "")}`}>
          Todas las personas <span className="text-xs text-ink-dim">{totalPeople}</span>
        </button>
        {shown.map((unit) => (
          <button key={unit.id} type="button" onClick={() => onSelect(unit.id)} className={`${item} ${tone(selectedId === unit.id)}`}>
            <span className="truncate">{unit.name}</span>
            <span className="text-xs text-ink-dim">{unit.memberIds.length}</span>
          </button>
        ))}
        <p className={`px-3 py-3 text-xs text-ink-dim ${units.length ? "hidden" : ""}`}>Aún no hay unidades: todos ven todo el sitio.</p>
      </nav>
      <div className="flex gap-2 border-t border-line pt-3">
        <input aria-label="Nombre de la nueva unidad" value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void create()} placeholder="Nueva unidad…" className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent" />
        <button type="button" onClick={() => void create()} className="h-10 rounded-lg bg-accent px-4 text-sm font-medium text-white cursor-pointer">Crear</button>
      </div>
    </aside>
  );
}
