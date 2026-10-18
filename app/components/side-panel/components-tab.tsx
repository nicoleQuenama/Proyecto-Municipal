"use client";

import { useState } from "react";
import { useCommands } from "../commands/commands-context";
import { Badge } from "../ui/badge";
import { duplicateComponent } from "../site/rules";
import { ComponentThumb } from "../site/component-view";
import { useSite, useSiteDispatch } from "../site/site-context";
import type { ComponentDef } from "../site/types";
import { plural } from "../versioning/versioning-rules";
import { FILTERS, type ComponentFilter } from "./data";

const rowButton =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-dim hover:bg-hover hover:text-ink";

interface ComponentRowProps {
  def: ComponentDef;
  usage: number;
  onAdd: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function ComponentRow({ def, usage, onAdd, onEdit, onDuplicate, onDelete }: ComponentRowProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <li className="flex flex-col gap-2 rounded-lg bg-red-500/10 p-2">
        <p role="alert" className="text-xs text-red-300">
          ¿Eliminar «{def.name}»?
          {usage > 0 && ` Se quitará de ${plural(usage, "bloque", "bloques")}.`}
        </p>
        <span className="flex gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="h-7 rounded-md border border-red-500/60 px-3 text-xs text-red-400 hover:bg-red-500/15"
          >
            Eliminar
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-7 rounded-md px-3 text-xs text-ink-dim hover:bg-hover hover:text-ink"
          >
            Cancelar
          </button>
        </span>
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-2 rounded-lg border border-transparent p-2 hover:border-line hover:bg-hover">
      <ComponentThumb def={def} />

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[13px] font-medium">
          <span className="truncate">{def.name}</span>
          {def.custom && <Badge tone="accent">Propio</Badge>}
        </p>
        <p className="truncate text-xs text-ink-dim">{def.description}</p>
      </div>

      {def.custom ? (
        <>
          <button type="button" aria-label={`Editar ${def.name}`} title="Editar" onClick={onEdit} className={`${rowButton} hidden group-hover:flex focus:flex`}>✎</button>
          <button type="button" aria-label={`Eliminar ${def.name}`} title="Eliminar" onClick={() => setConfirming(true)} className={`${rowButton} hidden hover:text-red-400 group-hover:flex focus:flex`}>×</button>
        </>
      ) : (
        <button type="button" aria-label={`Duplicar ${def.name} para editarlo`} title="Duplicar y editar" onClick={onDuplicate} className={`${rowButton} hidden group-hover:flex focus:flex`}>⧉</button>
      )}

      <button
        type="button"
        aria-label={`Agregar ${def.name} a la página`}
        title="Agregar a la página"
        onClick={onAdd}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-dim hover:bg-accent hover:text-white"
      >
        +
      </button>
    </li>
  );
}

export function ComponentsTab() {
  const { components, pages } = useSite();
  const dispatch = useSiteDispatch();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ComponentFilter>("all");
  const { openBuilder } = useCommands();

  const normalized = query.trim().toLowerCase();
  const visible = components.filter(
    (c) =>
      (filter === "all" || c.category === filter) &&
      (!normalized || c.name.toLowerCase().includes(normalized)),
  );

  const usageOf = (id: string) =>
    pages.reduce((total, page) => total + page.blocks.filter((b) => b.componentId === id).length, 0);

  const duplicate = (def: ComponentDef) =>
    openBuilder(duplicateComponent(def, crypto.randomUUID(), `${def.name} (copia)`));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-9 items-center gap-2 rounded-md bg-canvas px-3 focus-within:ring-1 focus-within:ring-accent">
        <span aria-hidden className="text-ink-dim">⌕</span>
        <input
          type="search"
          aria-label="Buscar componentes"
          placeholder="Buscar componentes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-dim"
        />
        <span className="rounded bg-hover px-1.5 py-0.5 text-[10px] text-ink-dim">UI Kit</span>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por categoría">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`h-7 rounded-md px-3 text-xs transition-colors ${
              filter === f.value ? "bg-accent text-white" : "bg-hover text-ink-dim hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => openBuilder("new")}
        className="h-9 rounded-md border border-dashed border-line text-xs hover:bg-hover"
      >
        + Nuevo componente
      </button>

      <p className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">
        Componentes · {visible.length}
      </p>
      <ul className="-mt-2 flex flex-col gap-1">
        {visible.map((def) => (
          <ComponentRow
            key={def.id}
            def={def}
            usage={usageOf(def.id)}
            onAdd={() => dispatch({ type: "block/add", id: crypto.randomUUID(), componentId: def.id })}
            onEdit={() => openBuilder(def)}
            onDuplicate={() => duplicate(def)}
            onDelete={() => dispatch({ type: "component/delete", id: def.id })}
          />
        ))}
        {visible.length === 0 && (
          <li className="py-6 text-center text-[13px] text-ink-dim">Sin resultados</li>
        )}
      </ul>
    </div>
  );
}
