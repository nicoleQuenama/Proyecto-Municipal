"use client";

import { useSiteDispatch } from "../site/site-context";
import type { BlockInstance } from "../site/types";
import { card, field } from "./binding-controls";
import { COLUMN_LIMITS } from "./grid-columns";
import { PagingControls } from "./paging-controls";
import type { RepeatLayout } from "./types";

type Column = "desktop" | "tablet" | "mobile";

const COLUMN_FIELDS: { key: Column; label: string }[] = [
  { key: "desktop", label: "Columnas en escritorio" },
  { key: "tablet", label: "Columnas en tablet" },
  { key: "mobile", label: "Columnas en móvil" },
];

const valueOf = (layout: RepeatLayout, key: Column) => (key === "desktop" ? layout.columns : layout.columnsOn?.[key]);

/** Cambia las columnas de un dispositivo; vacío (en tablet o móvil) = que se calculen solas. */
function withColumns(layout: RepeatLayout, key: Column, raw: string): RepeatLayout {
  const value = raw === "" ? undefined : Math.min(COLUMN_LIMITS.max, Math.max(COLUMN_LIMITS.min, Number(raw)));
  if (key === "desktop") return { ...layout, columns: value ?? layout.columns };
  const columnsOn = { ...layout.columnsOn, [key]: value };
  if (value === undefined) delete columnsOn[key];
  return { ...layout, columnsOn: Object.keys(columnsOn).length > 0 ? columnsOn : undefined };
}

/** Cómo se acomodan las copias de una sección que se repite por cada elemento de una lista. */
export function RepeatControls({ pageId, block }: { pageId: string; block: BlockInstance }) {
  const dispatch = useSiteDispatch();
  if (!block.repeat) return null;

  const layout = block.repeatLayout ?? { columns: 1, gap: 24 };
  const save = (next: RepeatLayout) => dispatch({ type: "repeat/layout", pageId, blockId: block.id, layout: next });

  return (
    <section className={card}>
      <p className="font-medium text-emerald-400">Se repite por cada elemento de la lista</p>
      <div className="grid grid-cols-2 gap-2">
        {COLUMN_FIELDS.map(({ key, label }) => (
          <label key={key} className="flex flex-col gap-1 text-ink-dim">
            {label}
            <input
              type="number"
              min={COLUMN_LIMITS.min}
              max={COLUMN_LIMITS.max}
              aria-label={label}
              placeholder="Automático"
              value={valueOf(layout, key) ?? ""}
              onChange={(e) => save(withColumns(layout, key, e.target.value))}
              className={field}
            />
          </label>
        ))}
        <label className="flex flex-col gap-1 text-ink-dim">
          Espacio (px)
          <input
            type="number"
            min={0}
            max={200}
            aria-label="Espacio entre copias"
            value={layout.gap}
            onChange={(e) => save({ ...layout, gap: Math.min(200, Math.max(0, Number(e.target.value))) })}
            className={field}
          />
        </label>
      </div>
      <p className="text-[11px] text-ink-dim">Se calcula solo si lo dejas vacío: tablet y móvil usan las columnas que caben.</p>
      <PagingControls pageId={pageId} block={block} />
    </section>
  );
}
