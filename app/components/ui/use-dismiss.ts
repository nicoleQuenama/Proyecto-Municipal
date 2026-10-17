import { useEffect, type RefObject } from "react";

/**
 * Cierra un popover o menú al hacer clic fuera de `ref` o al pulsar Esc.
 * Esc se captura antes que el <dialog> para que cierre solo el popover y no el modal.
 */
export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onDismiss();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onDismiss();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [ref, open, onDismiss]);
}
