/** Reglas puras de las ventanas modales: opciones por defecto y estilos (sin React). */

import type { CSSProperties } from "react";
import type { ModalAnimation, ModalOptions, ModalPosition, ModalSize } from "./types";

export const DEFAULT_MODAL_OPTIONS: ModalOptions = {
  size: "medium",
  position: "center",
  closeOnBackdrop: true,
  showClose: true,
  animation: "fade",
  backdrop: "rgba(0,0,0,0.55)",
};

export const SIZE_LABELS: Record<ModalSize, string> = {
  small: "Pequeña",
  medium: "Mediana",
  large: "Grande",
  full: "Pantalla completa",
};

export const POSITION_LABELS: Record<ModalPosition, string> = {
  center: "Centro",
  right: "Panel derecho",
  left: "Panel izquierdo",
  bottom: "Abajo",
};

export const ANIMATION_LABELS: Record<ModalAnimation, string> = {
  fade: "Fundido",
  rise: "Subir",
  zoom: "Zoom",
};

/** Ancho máximo de la ventana según su tamaño (px; «full» ocupa todo). */
const WIDTHS: Record<ModalSize, string> = { small: "420px", medium: "640px", large: "960px", full: "100vw" };
/** Alto del panel de abajo según su tamaño. */
const HEIGHTS: Record<ModalSize, string> = { small: "35vh", medium: "55vh", large: "80vh", full: "100vh" };

/** Cómo se reparte la ventana en la pantalla según su posición. */
const ALIGN: Record<ModalPosition, Pick<CSSProperties, "justifyContent" | "alignItems">> = {
  center: { justifyContent: "center", alignItems: "center" },
  right: { justifyContent: "flex-end", alignItems: "stretch" },
  left: { justifyContent: "flex-start", alignItems: "stretch" },
  bottom: { justifyContent: "stretch", alignItems: "flex-end" },
};

/** De dónde llega la ventana con la animación «Subir». */
const RISE_FROM: Record<ModalPosition, string> = {
  center: "0 28px",
  right: "60px 0",
  left: "-60px 0",
  bottom: "0 60px",
};

type PanelBox = Pick<CSSProperties, "width" | "maxWidth" | "height" | "maxHeight">;

/** El tamaño de la caja según posición y tamaño. */
const PANEL_BOX: Record<ModalPosition, (size: ModalSize) => PanelBox> = {
  center: (size) =>
    size === "full"
      ? { width: "100vw", height: "100vh" }
      : { width: WIDTHS[size], maxWidth: "94vw", maxHeight: "90vh" },
  right: (size) => ({ width: WIDTHS[size], maxWidth: "100vw", height: "100vh" }),
  left: (size) => ({ width: WIDTHS[size], maxWidth: "100vw", height: "100vh" }),
  bottom: (size) => ({ width: "100vw", height: HEIGHTS[size], maxHeight: "100vh" }),
};

/** Completa las opciones que faltan con las de por defecto. */
export const resolveModalOptions = (options?: Partial<ModalOptions>): ModalOptions => ({
  ...DEFAULT_MODAL_OPTIONS,
  ...options,
});

/** La capa que cubre la pantalla: el velo y el reparto de la ventana. */
export const overlayStyle = (options: ModalOptions): CSSProperties => ({
  background: options.backdrop,
  ...ALIGN[options.position],
});

/** La ventana: tamaño, esquinas y la animación de entrada. */
export function panelStyle(options: ModalOptions): CSSProperties {
  const edge = options.position === "center" && options.size !== "full";
  return {
    ...PANEL_BOX[options.position](options.size),
    borderRadius: edge ? 12 : 0,
    animationName: `modal-${options.animation}`,
    ["--modal-from" as string]: RISE_FROM[options.position],
  };
}
