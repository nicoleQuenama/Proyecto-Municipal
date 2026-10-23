import type { BlockInstance, ComponentDef } from "../site/types";
import { autoLayout } from "./auto-layout";
import { availableWidth, isAdaptive, type Device } from "./devices";
import { applyLayout } from "./manual-layout";

/** La sección ya con su formato, tal como se ve en un dispositivo: la definida a mano o la automática. */
export function adaptToDevice(view: ComponentDef, block: BlockInstance, device: Device, flow: boolean): ComponentDef {
  if (!isAdaptive(device)) return view;

  const layout = block.responsive?.[device];
  if (layout) return applyLayout(view, layout);
  // Una sección con flex o grid ya se acomoda sola.
  return flow ? view : autoLayout(view, availableWidth(device));
}
