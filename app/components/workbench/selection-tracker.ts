import type { editor as MonacoEditor, Selection } from "monaco-editor";
import { overlayPosition } from "./selection-overlay";

/** Lo seleccionado en el editor y dónde se superpone el panel. */
export interface SelectionInfo {
  text: string;
  range: Selection;
  top: number;
  left: number;
}

/** Cuánto se espera tras el último cambio de selección con el teclado antes de mostrar el panel. */
const SETTLE_MS = 150;
/** Una selección más corta que esto (sin contar espacios) no se ofrece para convertir. */
const MIN_SELECTION = 2;

/**
 * Avisa de la selección del editor cuando TERMINA: al soltar el ratón, o poco después de la última tecla
 * (Ctrl+A, Shift+flechas). Mientras se arrastra, no hay panel. Devuelve cómo dejar de escuchar.
 */
export function trackSelection(editor: MonacoEditor.IStandaloneCodeEditor, onSelect: (info: SelectionInfo | null) => void): () => void {
  let dragging = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const publish = () => {
    const range = editor.getSelection();
    const text = range ? (editor.getModel()?.getValueInRange(range) ?? "") : "";
    if (!range || range.isEmpty() || text.trim().length < MIN_SELECTION) return onSelect(null);

    const layout = editor.getLayoutInfo();
    // La primera línea de la selección que se ve en pantalla (con Ctrl+A y scroll, la de arriba del todo).
    const firstVisible = editor.getVisibleRanges()[0]?.startLineNumber ?? range.startLineNumber;
    const line = Math.max(range.startLineNumber, firstVisible);
    const lineTop = editor.getTopForLineNumber(line) - editor.getScrollTop();
    onSelect({ text, range, ...overlayPosition({ lineTop }, { width: layout.width, height: layout.height }) });
  };

  const subscriptions = [
    editor.onMouseDown(() => {
      dragging = true;
      onSelect(null);
    }),
    editor.onMouseUp(() => {
      dragging = false;
      publish();
    }),
    editor.onDidChangeCursorSelection(() => {
      clearTimeout(timer);
      if (dragging) return;
      onSelect(null);
      timer = setTimeout(publish, SETTLE_MS);
    }),
  ];

  return () => {
    clearTimeout(timer);
    subscriptions.forEach((subscription) => subscription.dispose());
  };
}
