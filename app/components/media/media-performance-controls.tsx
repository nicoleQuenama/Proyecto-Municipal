"use client";

import { Collapsible } from "../ui/collapsible";
import { useSiteDispatch } from "../site/site-context";
import type { CanvasElement } from "../site/types";

/** Rendimiento de una imagen o un video: por defecto se cargan al acercarse; lo principal se marca para cargarlo ya. */
export function MediaPerformanceControls({ componentId, pageId, blockId, element }: { componentId: string; pageId: string; blockId: string; element: CanvasElement }) {
  const dispatch = useSiteDispatch();
  return (
    <Collapsible title="Rendimiento">
      <label className="flex items-center gap-2 text-xs text-ink">
        <input
          type="checkbox"
          checked={!!element.eager}
          onChange={(e) => dispatch({ type: "component/eager", componentId, pageId, blockId, elementId: element.id, eager: e.target.checked })}
        />
        Cargar de inmediato
      </label>
      <p className="text-[11px] text-ink-dim">
        Márcalo solo en lo primero que se ve (la imagen principal). Lo demás se carga al acercarse a la pantalla, así la página abre más rápido.
        {element.kind === "video" ? " Un video sin reproducción automática baja solo su portada hasta que lo reproduzcan." : ""}
      </p>
    </Collapsible>
  );
}
