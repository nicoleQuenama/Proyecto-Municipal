"use client";

import { useRef, useState, type ReactNode } from "react";
import { IconGlyph } from "../icons/icon-glyph";
import { CellWidth } from "./available-context";
import { activeCard, cardPixels } from "./fold-model";
import type { CarouselFold } from "./types";

const DEFAULT_GAP = 16;

interface CarouselProps {
  fold: CarouselFold;
  /** Ancho que tiene la página para sus secciones en este dispositivo. */
  available: number;
  gap?: number;
  /** Una tarjeta por elemento. */
  children: ReactNode[];
}

const arrow = "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md hover:bg-white";

/** Las copias de una lista en una fila que se desliza con ajuste a cada tarjeta, con flechas y puntos. */
export function Carousel({ fold, available, gap = DEFAULT_GAP, children }: CarouselProps) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const card = cardPixels(available, fold.cardWidth);
  const step = card + gap;
  const goTo = (index: number) => track.current?.scrollTo({ left: Math.max(0, index) * step, behavior: "smooth" });

  return (
    <div role="region" aria-roledescription="carrusel" aria-label="Carrusel" className="relative max-w-full">
      <div
        ref={track}
        data-carousel=""
        onScroll={(e) => setActive(activeCard(e.currentTarget.scrollLeft, step, children.length))}
        className="-my-4 flex overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ gap, scrollSnapType: "x mandatory" }}
      >
        <CellWidth.Provider value={card}>
          {children.map((copy, index) => (
            <div key={index} className="shrink-0" style={{ width: card, scrollSnapAlign: "start" }}>
              {copy}
            </div>
          ))}
        </CellWidth.Provider>
      </div>
      {fold.arrows && children.length > 1 && (
        <>
          <button type="button" aria-label="Anterior" disabled={active === 0} onClick={() => goTo(active - 1)} className={`${arrow} left-1 disabled:opacity-30`}>
            <IconGlyph name="chevron-left" size={20} />
          </button>
          <button type="button" aria-label="Siguiente" disabled={active >= children.length - 1} onClick={() => goTo(active + 1)} className={`${arrow} right-1 disabled:opacity-30`}>
            <IconGlyph name="chevron-right" size={20} />
          </button>
        </>
      )}
      {fold.dots && children.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {children.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Tarjeta ${index + 1}`}
              aria-current={index === active}
              onClick={() => goTo(index)}
              className={`h-2 rounded-full transition-all ${index === active ? "w-5 bg-neutral-800" : "w-2 bg-neutral-400"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
