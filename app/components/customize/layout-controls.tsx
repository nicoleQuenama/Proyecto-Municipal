"use client";

import { NumberField } from "../ui/number-field";
import { Collapsible } from "../ui/collapsible";
import { applyCell, applyLayout, cellOf, isGridLayout, LAYOUT_LABELS, layoutOf, type LayoutKey } from "./layout-presets";

const MAX_COLS = 4;
const MAX_ROWS = 6;

interface LayoutControlsProps {
  /** Una sección entera, o uno de sus elementos (que solo puede elegir su celda en una cuadrícula). */
  isSection: boolean;
  /** Las clases de lo que se está editando (la sección o el elemento). */
  classes: string;
  /** Las clases de la sección: de ellas depende si sus elementos están en una cuadrícula. */
  sectionClasses: string;
  onChange: (classes: string) => void;
}

/** Cómo se acomodan los elementos de una sección: libres, en fila, columna, cuadrícula o bento. */
export function LayoutControls({ isSection, classes, sectionClasses, onChange }: LayoutControlsProps) {
  if (isSection) {
    const current = layoutOf(classes);
    return (
      <Collapsible title="Disposición">
        <p className="text-[11px] text-ink-dim">{LAYOUT_LABELS[current].help}</p>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(LAYOUT_LABELS) as LayoutKey[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={key === current}
              title={LAYOUT_LABELS[key].help}
              onClick={() => onChange(applyLayout(classes, key))}
              className={`h-7 rounded-md border px-2 text-[11px] ${key === current ? "border-accent bg-accent/20 text-accent" : "border-line text-ink hover:bg-hover"}`}
            >
              {LAYOUT_LABELS[key].label}
            </button>
          ))}
        </div>
        {current !== "free" && (
          <p className="text-[11px] text-ink-dim">
            Los elementos se acomodan solos y conservan su tamaño. {isGridLayout(current) ? "Elige un elemento para decidir cuántas columnas y filas ocupa." : ""}
          </p>
        )}
      </Collapsible>
    );
  }

  const layout = layoutOf(sectionClasses);
  if (!isGridLayout(layout)) return null;
  const cell = cellOf(classes);
  return (
    <Collapsible title="Celda de la cuadrícula">
      <p className="text-[11px] text-ink-dim">Cuánto ocupa este elemento: se estira para llenar sus celdas.</p>
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Columnas" value={cell.cols} min={1} max={MAX_COLS} onChange={(cols) => onChange(applyCell(classes, { ...cell, cols }))} />
        <NumberField label="Filas" value={cell.rows} min={1} max={MAX_ROWS} onChange={(rows) => onChange(applyCell(classes, { ...cell, rows }))} />
      </div>
    </Collapsible>
  );
}
