"use client";

import { useSiteDispatch } from "../site/site-context";
import type { Page } from "../site/types";
import { BackgroundForm } from "./background-form";

/** El fondo (imagen o video) de toda la página, detrás de sus secciones. */
export function PageBackground({ page }: { page: Page }) {
  const dispatch = useSiteDispatch();

  return (
    <div className="flex flex-col gap-2 rounded-md border border-line p-2 text-xs" aria-label={`Fondo de ${page.name}`}>
      <p className="font-medium">Fondo de la página</p>
      <BackgroundForm value={page.backdrop} onChange={(backdrop) => dispatch({ type: "page/backdrop", pageId: page.id, backdrop })} />
      <p className="text-[11px] text-ink-dim">El color de la página se cambia en la pestaña Estilo (regla «Página»).</p>
    </div>
  );
}
