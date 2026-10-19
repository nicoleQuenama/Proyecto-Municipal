"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Guides } from "../canvas-editing/snapping";

const NO_GUIDES: Guides = { x: [], y: [] };

const PageGuidesContext = createContext<((guides: Guides) => void) | null>(null);

/** Quien arrastra un elemento de la página publica aquí sus guías de alineación. */
export const usePageGuidesSetter = () => useContext(PageGuidesContext);

/** Dibuja las guías de una página y las pone al alcance de lo que se arrastra dentro de ella. */
export function PageGuidesProvider({ children }: { children: ReactNode }) {
  const [guides, setGuides] = useState<Guides>(NO_GUIDES);

  return (
    <PageGuidesContext value={setGuides}>
      {children}
      {guides.x.map((x) => (
        <span key={`x${x}`} aria-hidden className="pointer-events-none absolute top-0 bottom-0 z-40 w-px bg-rose-500" style={{ left: x }} />
      ))}
      {guides.y.map((y) => (
        <span key={`y${y}`} aria-hidden className="pointer-events-none absolute right-0 left-0 z-40 h-px bg-rose-500" style={{ top: y }} />
      ))}
    </PageGuidesContext>
  );
}
