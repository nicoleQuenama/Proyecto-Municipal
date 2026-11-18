/** Ancho del panel que se superpone y espacio que se le deja abajo (crece al abrir sus formularios). */
const PANEL_WIDTH = 288;
const PANEL_ROOM = 120;
const MARGIN = 8;
const RIGHT_GAP = 24;

/**
 * Dónde se coloca el panel de «convertir selección»: encima del código, a la derecha, a la altura de la primera
 * línea visible de lo seleccionado. Así se ve siempre, aunque la selección sea enorme (Ctrl+A) o termine fuera de la pantalla.
 */
export function overlayPosition(selection: { lineTop: number }, editor: { width: number; height: number }) {
  return {
    top: Math.max(MARGIN, Math.min(selection.lineTop, editor.height - PANEL_ROOM)),
    left: Math.max(MARGIN, editor.width - PANEL_WIDTH - RIGHT_GAP),
  };
}
