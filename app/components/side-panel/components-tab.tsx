"use client";

import { useState } from "react";
import { hasPermission, useAuth } from "../auth/auth-context";
import { useCommands } from "../commands/commands-context";
import { duplicateComponent } from "../site/rules";
import { EXAMPLE_COMPONENTS } from "../site/component-templates";
import { useSite, useSiteDispatch } from "../site/site-context";
import type { ComponentDef } from "../site/types";
import { categoryLabel, usedCategories } from "../site/categories";
import { ComponentRow } from "./component-row";
import type { ComponentFilter } from "./data";

export function ComponentsTab() {
  const site = useSite();
  const { pages } = site;
  // Las figuras dibujadas en la página no son componentes que se agreguen: no se listan.
  const components = site.components.filter((c) => !c.drawn);
  const dispatch = useSiteDispatch();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ComponentFilter>("all");
  const { openBuilder } = useCommands();
  const { currentUser } = useAuth();
  const canEditContent = hasPermission(currentUser, "editContent");

  // Solo las categorías que tienen componentes; si la elegida se vació, vuelve a «Todos».
  const categories = usedCategories(components);
  const activeFilter = filter === "all" || categories.includes(filter) ? filter : "all";
  const filters = [{ value: "all", label: "Todos" }, ...categories.map((value) => ({ value, label: categoryLabel(value) }))];

  const normalized = query.trim().toLowerCase();
  const visible = components.filter(
    (c) =>
      (activeFilter === "all" || c.category === activeFilter) &&
      (!normalized || c.name.toLowerCase().includes(normalized)),
  );

  const usageOf = (id: string) =>
    pages.reduce((total, page) => total + page.blocks.filter((b) => b.componentId === id).length, 0);

  const missingExamples = EXAMPLE_COMPONENTS.some((example) => !components.some((c) => c.id === example.id));

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
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={activeFilter === f.value}
            onClick={() => setFilter(f.value)}
            className={`h-7 rounded-md px-3 text-xs transition-colors ${
              activeFilter === f.value ? "bg-accent text-white" : "bg-hover text-ink-dim hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {canEditContent && (
        <button
          type="button"
          onClick={() => openBuilder("new")}
          className="h-9 rounded-md border border-dashed border-line text-xs hover:bg-hover"
        >
          + Nuevo componente
        </button>
      )}

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
            onEdit={() => canEditContent && openBuilder(def)}
            onDuplicate={() => canEditContent && duplicate(def)}
            onDelete={() => canEditContent && dispatch({ type: "component/delete", id: def.id })}
          />
        ))}
        {visible.length === 0 && components.length === 0 && (
          <li className="flex flex-col items-center gap-3 py-8 text-center text-[13px] text-ink-dim">
            Aún no has creado componentes.
            <button
              type="button"
              onClick={() => openBuilder("new")}
              className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-white hover:bg-accent/90"
            >
              + Nuevo componente
            </button>
          </li>
        )}
        {visible.length === 0 && components.length > 0 && (
          <li className="py-6 text-center text-[13px] text-ink-dim">Sin resultados</li>
        )}
      </ul>

      {missingExamples && (
        <button
          type="button"
          onClick={() => dispatch({ type: "components/restore" })}
          className="self-start text-[11px] text-ink-dim underline-offset-2 hover:text-ink hover:underline"
        >
          Restaurar los componentes de ejemplo
        </button>
      )}
    </div>
  );
}
