"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type Ref, type RefObject } from "react";
import { placeBeside, type Side } from "./place-beside";

interface TopLayerProps extends HTMLAttributes<HTMLDivElement> {
  /** El botón junto al que se abre; sin él, el menú se coloca con su propio `style` (left/top). */
  anchorRef?: RefObject<HTMLElement | null>;
  side?: Side;
  /** Para que quien lo usa (p. ej. `useDismiss`) alcance el elemento. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * Un menú o panel flotante en la capa superior del navegador (Popover API): se ve encima de todo —inspector,
 * vista previa, constructor, modales— sin depender de z-index ni de contextos de apilamiento. Se monta al abrir
 * y se desmonta al cerrar; Esc y clic fuera los maneja quien lo usa (`useDismiss`).
 */
export function TopLayer({ anchorRef, side = "top", style, children, ref: outerRef, ...rest }: TopLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    // Un <dialog> modal abierto después queda encima; un menú abierto dentro de él, también.
    if (!element.matches(":popover-open")) element.showPopover();
    return () => {
      if (element.matches(":popover-open")) element.hidePopover();
    };
  }, []);

  useLayoutEffect(() => {
    const anchor = anchorRef?.current;
    if (!anchor) return;
    const update = () =>
      setPlace(placeBeside(anchor.getBoundingClientRect(), side, { width: window.innerWidth, height: window.innerHeight }));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, side]);

  return (
    <div
      ref={(node) => {
        ref.current = node;
        if (typeof outerRef === "function") outerRef(node);
        else if (outerRef) outerRef.current = node;
      }}
      popover="manual"
      {...rest}
      style={{ ...style, ...place, ...(anchorRef && !place ? { visibility: "hidden" } : {}) }}
    >
      {children}
    </div>
  );
}
