import { useEffect } from "react";
import { useNavigation } from "../navigation/navigation-context";
import { useSite } from "../site/site-context";
import { TITLE_SELECTION } from "../site/types";
import { CANVAS_SURFACE_ID, fitZoom } from "./fit-zoom";
import { DEVICES, useViewport, ZOOM_STEPS } from "./viewport-context";

/**
 * Mantiene el zoom con el que caben todas las páginas en fila, mientras no se haya fijado a mano.
 * Al seleccionar algo se congela: abrir o cerrar los paneles cambia el ancho y, si el zoom los siguiera,
 * el lienzo se movería bajo el cursor a mitad de una edición. «Ajustar a la ventana» lo vuelve a activar.
 */
export function useAutoFit() {
  const { device, fitted, zoom, setZoom, applyFittedZoom } = useViewport();
  const { mode } = useNavigation();
  const { pages, selectedId } = useSite();
  const count = pages.length;
  const active = fitted && mode !== "preview";
  const selecting = selectedId !== TITLE_SELECTION;

  useEffect(() => {
    if (fitted && selecting && mode === "edit") setZoom(zoom);
  }, [fitted, selecting, mode, zoom, setZoom]);

  useEffect(() => {
    const surface = document.getElementById(CANVAS_SURFACE_ID);
    if (!active || !surface) return;

    const pageWidth = DEVICES.find((d) => d.value === device)?.width ?? 1024;
    const fit = () => {
      if (surface.clientWidth > 0) applyFittedZoom(fitZoom(count, pageWidth, surface.clientWidth, ZOOM_STEPS));
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(surface);
    return () => observer.disconnect();
  }, [active, count, device, applyFittedZoom]);
}
