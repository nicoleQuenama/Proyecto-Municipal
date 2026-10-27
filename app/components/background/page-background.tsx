"use client";

import { useSiteDispatch } from "../site/site-context";
import type { Page } from "../site/types";
import { HexField } from "../section-colors/hex-field";
import { BackgroundForm } from "./background-form";

/** El fondo (imagen o video) de toda la página, detrás de sus secciones. */
export function PageBackground({ page }: { page: Page }) {
  const dispatch = useSiteDispatch();

  return (
    <div className="flex flex-col gap-2 rounded-md border border-line p-2 text-xs" aria-label={`Fondo de ${page.name}`}>
      <p className="font-medium">Fondo de la página</p>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-ink-dim">Color</span>
        <div className="w-24">
          <HexField value={page.color ?? "#ffffff"} onChange={(color) => dispatch({ type: "page/color", pageId: page.id, color })} />
        </div>
        {page.color && (
          <button
            type="button"
            onClick={() => dispatch({ type: "page/color", pageId: page.id, color: undefined })}
            className="text-[11px] text-ink-dim underline-offset-2 hover:text-ink hover:underline"
          >
            Quitar
          </button>
        )}
      </div>
      <BackgroundForm value={page.backdrop} onChange={(backdrop) => dispatch({ type: "page/backdrop", pageId: page.id, backdrop })} />
    </div>
  );
}
