import type { CSSProperties } from "react";
import { useViewport } from "./viewport-context";

/** Tamaño de los íconos sobre el lienzo (px): no se encogen con el zoom, salvo uno menor al verlo muy alejado. */
export const HANDLE_SIZE = 20;
const SMALL_SIZE = 12;
const SMALL_BELOW_ZOOM = 50;

/** Estilo para que un ícono mida lo mismo en pantalla sea cual sea el zoom del lienzo. */
export function useHandleSize(): CSSProperties {
  const { zoom } = useViewport();
  const size = zoom < SMALL_BELOW_ZOOM ? SMALL_SIZE : HANDLE_SIZE;
  return { width: size, height: size, zoom: 100 / zoom };
}
