import type { RefObject } from "react";
import type { CanvasElement, DockSlot } from "../site/types";
import type { DockAnchor, Point } from "./dock-slots";
import type { Size } from "./limits";
import type { CanvasSettings } from "./settings-context";
import type { Edges, Sides } from "./edges";

/** La caja nueva de un elemento al redimensionarlo; `offset` si está acoplado en posición libre. */
export interface ResizeFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  offset?: Point;
}

/** Lo que un gesto puede cambiar. Cada lienzo (constructor, página) lo guarda a su manera. */
export interface CanvasCommands {
  select: (id: string) => void;
  /** Mueve un elemento donde quiera; lo suelta de su contenedor. */
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, frame: ResizeFrame) => void;
  /** Acopla un elemento a un contenedor o lo suelta (`parentId` null). */
  dock: (id: string, parentId: string | null, anchor?: DockAnchor) => void;
}

/** Un gesto en curso: mover el elemento entero o redimensionarlo por una manija. */
export interface DragState {
  id: string;
  sides: Sides;
  resizing: boolean;
  startX: number;
  startY: number;
  start: Edges;
  moved: boolean;
  /** Cuántos píxeles de pantalla mide un píxel del lienzo (el zoom de la página). */
  scale: number;
  /** Dónde quedó la esquina del elemento en el último movimiento. */
  corner: Point;
}

/** Dónde caería el elemento arrastrado si se suelta ahora: el contenedor y, si queda cerca de una, la casilla. */
export interface DropState {
  parent: CanvasElement;
  slot: DockSlot | null;
}

export interface GestureOptions {
  size: Size;
  elements: CanvasElement[];
  settings: CanvasSettings;
  commands: CanvasCommands;
  canvasRef: RefObject<HTMLDivElement | null>;
  /** Estirar el fondo de la sección (una pieza que la cubre toda) agranda la sección en lugar de toparse con ella. */
  backdropGrowsSection?: boolean;
}
