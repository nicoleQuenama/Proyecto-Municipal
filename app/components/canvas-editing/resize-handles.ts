import type { Sides } from "./edges";

export type HandleId = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface HandleDef {
  /** Qué bordes del elemento mueve esta manija. */
  sides: Sides;
  /** Clases de Tailwind: dónde se dibuja y qué cursor muestra. */
  className: string;
}

const sides = (...moving: (keyof Sides)[]): Sides => ({
  left: moving.includes("left"),
  top: moving.includes("top"),
  right: moving.includes("right"),
  bottom: moving.includes("bottom"),
});

/** Las ocho manijas de un elemento: cuatro esquinas y cuatro lados. Añadir o quitar una es tocar esta tabla. */
export const HANDLES: Record<HandleId, HandleDef> = {
  nw: { sides: sides("left", "top"), className: "-top-1.5 -left-1.5 cursor-nwse-resize" },
  n: { sides: sides("top"), className: "-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize" },
  ne: { sides: sides("right", "top"), className: "-top-1.5 -right-1.5 cursor-nesw-resize" },
  e: { sides: sides("right"), className: "top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize" },
  se: { sides: sides("right", "bottom"), className: "-right-1.5 -bottom-1.5 cursor-nwse-resize" },
  s: { sides: sides("bottom"), className: "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize" },
  sw: { sides: sides("left", "bottom"), className: "-bottom-1.5 -left-1.5 cursor-nesw-resize" },
  w: { sides: sides("left"), className: "top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize" },
};

export const HANDLE_IDS = Object.keys(HANDLES) as HandleId[];
