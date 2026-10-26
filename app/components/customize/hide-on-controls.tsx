"use client";

import { elementLabel } from "../navigation/links";
import { DEVICE_NAME, type AdaptiveDevice } from "../responsive/devices";
import { isHiddenOn } from "../responsive/hidden-on";
import { useSiteDispatch } from "../site/site-context";
import type { BlockInstance, ComponentDef } from "../site/types";

const ADAPTIVE: AdaptiveDevice[] = ["tablet", "mobile"];

interface HideOnControlsProps {
  pageId: string;
  block: BlockInstance;
  def: ComponentDef;
  /** El elemento seleccionado; sin él, la sección entera. */
  elementId?: string;
}

/** «Ocultar en tablet / móvil» de la sección o del elemento seleccionado, y cómo volver a mostrar lo que se ocultó. */
export function HideOnControls({ pageId, block, def, elementId }: HideOnControlsProps) {
  const dispatch = useSiteDispatch();
  const current = elementId ? block.elements?.[elementId]?.hiddenOn : block.hiddenOn;
  const set = (device: AdaptiveDevice, hidden: boolean, id = elementId) =>
    dispatch({ type: "responsive/hide", pageId, blockId: block.id, elementId: id, device, hidden });

  // Un elemento oculto en un dispositivo no se dibuja ahí, así que se vuelve a mostrar desde la sección.
  const hiddenElements = elementId
    ? []
    : def.elements.filter((element) => ADAPTIVE.some((d) => isHiddenOn(block.elements?.[element.id]?.hiddenOn, d)));

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-line p-3 text-xs">
      <p className="font-medium">Mostrar según el dispositivo</p>
      {ADAPTIVE.map((device) => (
        <label key={device} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isHiddenOn(current, device)}
            onChange={(e) => set(device, e.target.checked)}
            className="accent-accent"
          />
          Ocultar en {DEVICE_NAME[device].plain}
        </label>
      ))}
      <p className="text-[11px] text-ink-dim">En el escritorio se sigue viendo. Útil para quitar adornos en el móvil.</p>

      {hiddenElements.map((element) => (
        <div key={element.id} className="flex flex-wrap items-center gap-1 text-ink-dim">
          <span className="min-w-0 flex-1 truncate">{elementLabel(element)} (oculto)</span>
          {ADAPTIVE.filter((d) => isHiddenOn(block.elements?.[element.id]?.hiddenOn, d)).map((device) => (
            <button
              key={device}
              type="button"
              onClick={() => set(device, false, element.id)}
              className="rounded-md border border-line px-2 py-1 hover:bg-hover hover:text-ink"
            >
              Mostrar en {DEVICE_NAME[device].plain}
            </button>
          ))}
        </div>
      ))}
    </section>
  );
}
