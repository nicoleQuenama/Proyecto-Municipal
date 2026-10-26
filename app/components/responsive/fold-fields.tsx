"use client";

import type { ReactNode } from "react";
import type { ComponentDef } from "../site/types";
import { accordionTitle } from "./fold-accordion";
import { FOLD_LIMITS } from "./fold-model";
import { readingOrder } from "./menu-model";
import type { FoldConfig, FoldKind } from "./types";

interface FieldsProps<K extends FoldKind> {
  fold: Extract<FoldConfig, { kind: K }>;
  view: ComponentDef;
  change: (changes: Partial<Extract<FoldConfig, { kind: K }>>) => void;
}

const box = "h-7 rounded-md border border-line bg-canvas px-2 text-ink outline-none focus:border-accent";
const label = "flex items-center gap-1.5 text-ink-dim";

const check = (text: string, checked: boolean, onChange: (value: boolean) => void) => (
  <label className={`${label} cursor-pointer`}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    {text}
  </label>
);

/** Los ajustes de cada presentación. Una nueva es una entrada nueva. */
export const FOLD_FIELDS: { [K in FoldKind]: (props: FieldsProps<K>) => ReactNode } = {
  carousel: ({ fold, change }) => (
    <>
      <label className={label}>
        Ancho de cada tarjeta
        <input type="number" className={`${box} w-16`} min={FOLD_LIMITS.cardWidth.min} max={FOLD_LIMITS.cardWidth.max} value={fold.cardWidth} onChange={(e) => change({ cardWidth: Number(e.target.value) || 85 })} />
        %
      </label>
      <p className="text-ink-dim">Con 85 % se ve una tarjeta y un poco de la siguiente.</p>
      {check("Puntos indicadores", fold.dots, (dots) => change({ dots }))}
      {check("Flechas", fold.arrows, (arrows) => change({ arrows }))}
    </>
  ),
  more: ({ fold, change }) => (
    <>
      <label className={label}>
        Altura antes de cortar
        <input type="number" className={`${box} w-20`} min={FOLD_LIMITS.maxHeight.min} max={FOLD_LIMITS.maxHeight.max} value={fold.maxHeight} onChange={(e) => change({ maxHeight: Number(e.target.value) || 320 })} />
        px
      </label>
      <label className={label}>
        Texto del botón
        <input className={`${box} w-24`} value={fold.moreLabel} onChange={(e) => change({ moreLabel: e.target.value })} />
        <input className={`${box} w-24`} aria-label="Texto al estar abierto" value={fold.lessLabel} onChange={(e) => change({ lessLabel: e.target.value })} />
      </label>
    </>
  ),
  accordion: ({ fold, view, change }) => {
    const titles = view.elements.filter((e) => !e.hidden && e.text.trim() !== "").sort(readingOrder);
    return (
      <>
        <label className={label}>
          Título que se toca
          <select className={`${box} max-w-40`} value={accordionTitle(view, fold.titleId)?.id ?? ""} onChange={(e) => change({ titleId: e.target.value })}>
            {titles.map((t) => (
              <option key={t.id} value={t.id}>{t.text.trim().slice(0, 24)}</option>
            ))}
          </select>
        </label>
        {check("Empieza abierta", fold.open, (open) => change({ open }))}
      </>
    );
  },
};
