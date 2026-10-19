import type { PointerEvent } from "react";
import { HANDLES, HANDLE_IDS, type HandleId } from "./resize-handles";

/** Las ocho manijas de un elemento seleccionado; arrastrar una cambia el tamaño por ese lado o esquina. */
export function ElementHandles({
  onStart,
  only = HANDLE_IDS,
}: {
  onStart: (e: PointerEvent<HTMLElement>, handle: HandleId) => void;
  /** Solo estas manijas (el fondo de una tarjeta solo crece hacia la derecha y hacia abajo). */
  only?: HandleId[];
}) {
  return only.map((handle) => (
    <span
      key={handle}
      aria-label="Cambiar tamaño"
      onPointerDown={(e) => onStart(e, handle)}
      className={`absolute z-10 h-2.5 w-2.5 touch-none border-2 border-sky-500 bg-white ${HANDLES[handle].className}`}
    />
  ));
}
