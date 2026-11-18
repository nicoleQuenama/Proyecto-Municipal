"use client";

import { useSite } from "../site/site-context";
import { DataField } from "./data-field";
import { fieldKind, type FieldKind } from "./field-kinds";
import type { CellValue, DataRow } from "./types";

interface DataRowViewProps {
  setName: string;
  index: number;
  row: DataRow;
  /** Solo las listas tienen controles de fila; un objeto suelto es una sola fila fija. */
  list: boolean;
  count: number;
  onSet: (key: string, value: CellValue) => void;
  onRemove: () => void;
  onMove: (to: number) => void;
}

type Site = ReturnType<typeof useSite>;

/** De dónde vienen las sugerencias de cada tipo de campo. */
const SUGGESTIONS: Partial<Record<FieldKind, (site: Site) => string[]>> = {
  link: (site) => site.pages.map((page) => (page.isHome ? "/" : `/${page.slug}`)),
  media: (site) => (site.projectMedia ?? []).map((asset) => asset.src),
};

const iconButton = "h-6 w-6 rounded bg-hover text-ink-dim hover:text-ink disabled:opacity-30 cursor-pointer";

/** Una fila de datos: un campo por cada valor del objeto. */
export function DataRowView({ setName, index, row, list, count, onSet, onRemove, onMove }: DataRowViewProps) {
  const site = useSite();

  return (
    <li className="rounded-md border border-line bg-canvas/40 p-2">
      {list && (
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-ink-dim">
          <span>Elemento {index + 1}</span>
          <span className="flex gap-1">
            <button type="button" aria-label="Subir" disabled={index === 0} onClick={() => onMove(index - 1)} className={iconButton}>↑</button>
            <button type="button" aria-label="Bajar" disabled={index === count - 1} onClick={() => onMove(index + 1)} className={iconButton}>↓</button>
            <button type="button" aria-label="Quitar" disabled={count === 1} onClick={onRemove} className={iconButton}>✕</button>
          </span>
        </div>
      )}
      <div className="grid gap-1.5">
        {row.cells.map((cell) => {
          const kind = fieldKind(cell.key, cell.value);
          return (
            <div key={`${index}-${cell.key}`} className="grid grid-cols-[6rem_1fr] items-center gap-2 text-[11px] text-ink-dim">
              <span className="truncate" title={cell.key}>{cell.key}</span>
              <DataField
                kind={kind}
                label={`${setName} ${index + 1} · ${cell.key}`}
                value={cell.value}
                suggestions={kind === "readonly" ? [] : (SUGGESTIONS[kind]?.(site) ?? [])}
                onChange={(value) => onSet(cell.key, value)}
              />
            </div>
          );
        })}
      </div>
    </li>
  );
}
