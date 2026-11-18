"use client";

import type { PointerEvent } from "react";

export type Corner = "nw" | "ne" | "sw" | "se";
const CORNERS: Corner[] = ["nw", "ne", "sw", "se"];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * El radio de las esquinas que corresponde a un puntero que arrastra la bolita de una esquina: la distancia a esa
 * esquina por la diagonal, en píxeles del diseño. Como el radio es uno solo, las cuatro esquinas lo siguen a la vez.
 */
export function radiusFor(
  corner: Corner,
  pointer: { x: number; y: number },
  box: { left: number; top: number; right: number; bottom: number },
  scale: number,
  size: { width: number; height: number },
): number {
  const dx = corner.endsWith("w") ? pointer.x - box.left : box.right - pointer.x;
  const dy = corner.startsWith("n") ? pointer.y - box.top : box.bottom - pointer.y;
  return clamp(Math.round((dx + dy) / 2 / scale), 0, Math.floor(Math.min(size.width, size.height) / 2));
}

/** Dónde se dibuja cada bolita: dentro de su esquina, a la distancia del radio (con un mínimo para poder agarrarla). */
const PLACE: Record<Corner, (inset: number) => { top?: number; bottom?: number; left?: number; right?: number }> = {
  nw: (d) => ({ top: d, left: d }),
  ne: (d) => ({ top: d, right: d }),
  sw: (d) => ({ bottom: d, left: d }),
  se: (d) => ({ bottom: d, right: d }),
};

interface RadiusHandlesProps {
  radius: number;
  size: { width: number; height: number };
  onChange: (radius: number) => void;
}

/** Cuatro bolitas, una por esquina: arrastrar cualquiera redondea las cuatro esquinas por igual. */
export function RadiusHandles({ radius, size, onChange }: RadiusHandlesProps) {
  const start = (e: PointerEvent<HTMLElement>, corner: Corner) => {
    const element = e.currentTarget.parentElement;
    if (!element) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const box = element.getBoundingClientRect();
    const scale = box.width / size.width || 1;

    const move = (ev: globalThis.PointerEvent) => onChange(radiusFor(corner, { x: ev.clientX, y: ev.clientY }, box, scale, size));
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  // La bolita mide 8: se resta la mitad para que su centro quede a la distancia del radio.
  const inset = Math.max(radius, 8) - 4;
  return CORNERS.map((corner) => (
    <span
      key={corner}
      aria-label="Redondear las esquinas"
      title="Arrastra para redondear las esquinas"
      onPointerDown={(e) => start(e, corner)}
      style={PLACE[corner](inset)}
      className="absolute z-20 h-2 w-2 cursor-pointer touch-none rounded-full border border-white bg-sky-500 shadow"
    />
  ));
}
