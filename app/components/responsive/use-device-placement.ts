"use client";

import type { Placement } from "../placement/types";
import { useViewport } from "../viewport/viewport-context";
import { isAdaptive } from "./devices";

/** La posición libre solo vale en el escritorio: en tablet y móvil el elemento va en el flujo de la página. */
export function useDevicePlacement(placement: Placement | undefined): Placement | undefined {
  const { device } = useViewport();
  return isAdaptive(device) ? undefined : placement;
}
