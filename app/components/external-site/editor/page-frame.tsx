"use client";

import { useEffect, useRef, useState } from "react";
import { DEVICE_WIDTH, type Device } from "../../responsive/devices";
import { applyPatches } from "../apply-patches";
import type { ExternalState } from "../types";
import type { PickedElement } from "./use-patch-editing";
import { usePicker } from "./use-picker";

interface PageFrameProps {
  state: ExternalState;
  device: Device;
  onPick: (picked: PickedElement) => void;
}

/** La página real del cliente a ancho de escritorio, tablet o móvil, con sus cambios ya aplicados. */
export function PageFrame({ state, device, onPick }: PageFrameProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  // Cuántas veces se cargó el documento: cada carga nueva necesita volver a aplicar los cambios y escuchar clics.
  const [loads, setLoads] = useState(0);
  const path = new URL(state.pageUrl).pathname;

  // Cada cambio se ve al instante: se vuelven a aplicar sobre el documento ya cargado.
  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (loads > 0 && doc) applyPatches(doc, state.patches, path, state.autoResponsive);
  }, [loads, state.patches, state.autoResponsive, path]);

  usePicker(frame, loads, path, onPick);

  return (
    <iframe
      ref={frame}
      title={`Página de ${state.site}`}
      // Sin allow-scripts: el JavaScript de la página del cliente no corre dentro del editor.
      sandbox="allow-same-origin"
      srcDoc={state.html ?? ""}
      onLoad={() => setLoads((count) => count + 1)}
      className="mx-auto h-full rounded-md border border-line bg-white shadow-2xl transition-[width] duration-200"
      style={{ width: DEVICE_WIDTH[device] }}
    />
  );
}
