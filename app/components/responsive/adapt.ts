import type { BlockInstance, ComponentDef } from "../site/types";
import { availableWidth, isAdaptive, type Device } from "./devices";
import { visibleOn } from "./hidden-on";
import { applyLayout } from "./manual-layout";
import { smartStrategy, STRATEGIES } from "./strategies";
import type { AutoStrategy } from "./types";

/** La estrategia automática de una sección en un dispositivo: la elegida o, si no, la inteligente. */
export const strategyFor = (view: ComponentDef, block: BlockInstance, device: Device, available: number): AutoStrategy =>
  (isAdaptive(device) ? block.adapt?.[device] : undefined) ?? smartStrategy(view, available);

/**
 * La sección ya con su formato, tal como se ve en un dispositivo: sin lo que se ocultó ahí, y definida a mano,
 * escalada o apilada. `available` es el ancho de su casilla (por defecto, el de la página en ese dispositivo).
 */
export function adaptToDevice(
  view: ComponentDef,
  block: BlockInstance,
  device: Device,
  flow: boolean,
  available: number = availableWidth(device),
): ComponentDef {
  const elements = visibleOn(view.elements, device);
  const shown = elements === view.elements ? view : { ...view, elements };
  if (!isAdaptive(device)) {
    if (block.adapt?.desktop === "menu") {
      return STRATEGIES.menu(shown, available, block);
    }
    return shown;
  }

  const layout = block.responsive?.[device];
  if (layout) return applyLayout(shown, layout);
  // Una sección con flex o grid ya se acomoda sola.
  return flow ? shown : STRATEGIES[strategyFor(shown, block, device, available)](shown, available, block);
}
