"use client";

import { useCanvasSettings } from "../canvas-editing/settings-context";
import { deletionPlan } from "../site/deletion-plan";
import { useSite, useSiteDispatch } from "../site/site-context";
import type { Page } from "../site/types";
import { plural } from "../versioning/versioning-rules";

/** Lo que el botón avisa según qué se elimina y con qué alcance. */
function hintOf(elementCount: number, scope: "block" | "component", usage: number): string {
  if (elementCount === 0) return "Quita la sección entera de esta página.";
  return scope === "block"
    ? "Solo se quita de este bloque; el componente y los demás bloques siguen igual."
    : `Se quita del componente, así que desaparece de ${plural(usage, "bloque", "bloques")}.`;
}

/** «Eliminar» del inspector: el elemento o los elementos seleccionados, o la sección si no hay elemento. */
export function RemoveButton({ page }: { page: Page }) {
  const site = useSite();
  const dispatch = useSiteDispatch();
  const { settings } = useCanvasSettings();

  const action = deletionPlan(page, site, settings.scope);
  if (!action) return null;

  const elementCount = action.type === "element/remove" ? action.elementIds.length : 0;
  const block = page.blocks.find((b) => b.id === site.selectedId);
  const usage = site.pages.reduce((n, p) => n + p.blocks.filter((b) => b.componentId === block?.componentId).length, 0);
  const label = elementCount === 0 ? "Eliminar sección" : elementCount === 1 ? "Eliminar elemento" : `Eliminar ${elementCount} elementos`;

  return (
    <div className="flex flex-col gap-1.5 border-t border-line p-3">
      <button
        type="button"
        onClick={() => dispatch(action)}
        title="Atajo: Supr"
        className="h-9 rounded-md border border-red-500/60 text-xs font-medium text-red-400 hover:bg-red-500/15"
      >
        {label}
      </button>
      <p className="text-[11px] text-ink-dim">{hintOf(elementCount, settings.scope, usage)}</p>
    </div>
  );
}
