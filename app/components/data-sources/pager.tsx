"use client";

import type { CSSProperties } from "react";
import type { PagerModel } from "./paging";

interface PagerProps {
  model: PagerModel;
  onPage: (page: number) => void;
  /** Color de la página actual. */
  accent?: string;
  /** Redondeo de los botones (px). */
  radius?: number;
}

// Hereda el color del texto de la página y usa un borde suave de ese mismo color: se ve bien sobre fondos claros y oscuros.
const SOFT_BORDER = "color-mix(in srgb, currentColor 28%, transparent)";
const button = "inline-flex h-9 min-w-9 items-center justify-center border px-2.5 text-sm transition-colors disabled:opacity-40";

/** La barra de páginas: ‹ Anterior · 1 2 3 … · Siguiente ›. Se acomoda en varias filas en pantallas estrechas. */
export function Pager({ model, onPage, accent, radius = 8 }: PagerProps) {
  const base: CSSProperties = { borderRadius: radius, borderColor: SOFT_BORDER };
  const current: CSSProperties = {
    ...base,
    background: accent ?? "var(--color-accent, #0d99ff)",
    borderColor: "transparent",
    color: "#fff",
    fontWeight: 600,
  };

  return (
    <nav aria-label="Paginación" data-pager="" className="flex w-full flex-wrap items-center justify-center gap-1.5 py-3">
      <button type="button" className={button} style={base} disabled={!model.hasPrev} onClick={() => onPage(model.page - 1)}>
        ‹ Anterior
      </button>
      {model.buttons.map((item, index) =>
        item === "…" ? (
          <span key={`gap-${index}`} aria-hidden className="px-1 opacity-60">…</span>
        ) : (
          <button
            key={item}
            type="button"
            className={button}
            style={item === model.page ? current : base}
            aria-current={item === model.page ? "page" : undefined}
            aria-label={`Página ${item}`}
            onClick={() => onPage(item)}
          >
            {item}
          </button>
        ),
      )}
      {model.buttons.length === 0 && <span className="px-2 text-sm opacity-70">Página {model.page}</span>}
      <button type="button" className={button} style={base} disabled={!model.hasNext} onClick={() => onPage(model.page + 1)}>
        Siguiente ›
      </button>
    </nav>
  );
}
