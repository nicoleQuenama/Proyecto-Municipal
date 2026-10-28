"use client";

import { Collapsible } from "../ui/collapsible";
import { NumberField } from "../ui/number-field";
import { useSiteDispatch } from "../site/site-context";
import type { CanvasElement } from "../site/types";
import { defaultFluid, fluidSizeAt } from "./fluid-text";

const DEVICES_SHOWN = [
  { label: "Móvil", width: 375 },
  { label: "Tablet", width: 768 },
  { label: "Escritorio", width: 1024 },
];

/** Texto adaptable: el tamaño sigue al ancho de la pantalla, entre un mínimo y un máximo que se eligen aquí. */
export function FluidControls({ componentId, pageId, blockId, element }: { componentId: string; pageId: string; blockId: string; element: CanvasElement }) {
  const dispatch = useSiteDispatch();
  const { fluid } = element;
  const send = (next: typeof fluid | null) =>
    dispatch({ type: "component/fluid", componentId, pageId, blockId, elementId: element.id, fluid: next ?? null });

  return (
    <Collapsible title="Tamaño adaptable">
      <label className="flex items-center gap-2 text-xs text-ink">
        <input type="checkbox" checked={!!fluid} onChange={(e) => send(e.target.checked ? defaultFluid(element.fontSize) : null)} />
        Se adapta al ancho de la pantalla
      </label>
      {!fluid && <p className="text-[11px] text-ink-dim">Hoy mide {element.fontSize} px en todas las pantallas.</p>}
      {fluid && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Mínimo (px)" value={fluid.min} min={6} max={400} onChange={(min) => send({ ...fluid, min })} />
            <NumberField label="Máximo (px)" value={fluid.max} min={6} max={400} onChange={(max) => send({ ...fluid, max })} />
          </div>
          <ul className="flex flex-col gap-0.5 text-[11px] text-ink-dim">
            {DEVICES_SHOWN.map((device) => (
              <li key={device.label}>
                {device.label} ({device.width} px): <span className="text-ink">{fluidSizeAt(element.fontSize, fluid, device.width)} px</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Collapsible>
  );
}
