import type { CSSProperties } from "react";
import type { MenuPanel } from "./types";

export interface PanelStyle {
  label: string;
  help: string;
  /** Se dibuja sobre la página entera (lateral y pantalla completa); si no, bajo la cabecera. */
  coversPage: boolean;
  frame: CSSProperties;
  /** Cómo entra (animación web); la salida es inmediata. */
  enter: Keyframe[];
}

const FADE_IN = { opacity: 0 };
const SETTLED = { opacity: 1, transform: "none" };

/** Los cuatro tipos de panel. Uno nuevo es una entrada nueva (y su tarjeta aparece sola en el editor). */
export const PANEL_STYLES: Record<MenuPanel, PanelStyle> = {
  drop: {
    label: "Desplegable",
    help: "Cae justo debajo de la cabecera.",
    coversPage: false,
    frame: { position: "absolute", top: "100%", left: 0, right: 0 },
    enter: [{ ...FADE_IN, transform: "translateY(-10px)" }, SETTLED],
  },
  left: {
    label: "Lateral izquierdo",
    help: "Se desliza desde la izquierda.",
    coversPage: true,
    frame: { position: "absolute", top: 0, bottom: 0, left: 0, width: "78%", maxWidth: 320 },
    enter: [{ transform: "translateX(-100%)" }, SETTLED],
  },
  right: {
    label: "Lateral derecho",
    help: "Se desliza desde la derecha.",
    coversPage: true,
    frame: { position: "absolute", top: 0, bottom: 0, right: 0, width: "78%", maxWidth: 320 },
    enter: [{ transform: "translateX(100%)" }, SETTLED],
  },
  full: {
    label: "Pantalla completa",
    help: "Ocupa toda la pantalla, con una X para cerrar.",
    coversPage: true,
    frame: { position: "absolute", inset: 0 },
    enter: [{ ...FADE_IN, transform: "scale(0.97)" }, SETTLED],
  },
};

export const PANEL_ORDER: MenuPanel[] = ["drop", "left", "right", "full"];
