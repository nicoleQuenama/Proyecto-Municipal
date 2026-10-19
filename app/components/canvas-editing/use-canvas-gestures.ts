"use client";

import { useRef, useState, type PointerEvent } from "react";
import type { CanvasElement } from "../site/types";
import { descendantIds } from "./containers";
import type { DockAnchor, Point } from "./dock-slots";
import type { DragState, DropState, GestureOptions } from "./gesture-types";
import { planMove } from "./move-plan";
import { planResize } from "./resize-plan";
import { HANDLES, type HandleId } from "./resize-handles";
import { ALL_SIDES, edgesOf, shiftEdges, type Edges } from "./edges";
import { snapEdges, type Guides } from "./snapping";

export type { CanvasCommands, DropState, ResizeFrame } from "./gesture-types";

/** Píxeles que hay que arrastrar antes de que un clic cuente como movimiento. */
const DRAG_THRESHOLD = 3;

const NO_GUIDES: Guides = { x: [], y: [] };

/** Mover y redimensionar con imán, guías y acoplado; devuelve lo que el lienzo debe dibujar mientras tanto. */
export function useCanvasGestures({
  size,
  elements,
  settings,
  commands,
  canvasRef,
  backdropGrowsSection = false,
}: GestureOptions) {
  const drag = useRef<DragState | null>(null);
  const [guides, setGuides] = useState<Guides>(NO_GUIDES);
  const [drop, setDrop] = useState<DropState | null>(null);
  // Al soltar hace falta el destino más reciente, aunque React aún no haya redibujado.
  const latestDrop = useRef<DropState | null>(null);

  const updateDrop = (next: DropState | null) => {
    latestDrop.current = next;
    setDrop(next);
  };

  const startDrag = (e: PointerEvent<HTMLElement>, element: CanvasElement, handle?: HandleId) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.stopPropagation();
    commands.select(element.id);

    drag.current = {
      id: element.id,
      sides: handle ? HANDLES[handle].sides : ALL_SIDES,
      resizing: handle !== undefined,
      startX: e.clientX,
      startY: e.clientY,
      start: edgesOf(element),
      moved: false,
      scale: canvas.getBoundingClientRect().width / canvas.offsetWidth || 1,
      corner: { x: element.x, y: element.y },
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  /** Dónde está el puntero, en coordenadas del lienzo. */
  const canvasPoint = (e: PointerEvent<HTMLElement>, scale: number): Point => {
    const box = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - box.left) / scale, y: (e.clientY - box.top) / scale };
  };

  /** Los bordes del lienzo y de los demás elementos, a los que el gesto puede pegarse. */
  const snapReferences = (id: string): Edges[] => {
    const own = descendantIds(elements, id).add(id);
    return [
      { left: 0, top: 0, right: size.width, bottom: size.height },
      ...elements.filter((e) => !own.has(e.id)).map(edgesOf),
    ];
  };

  /** Dónde quedaría el elemento con el gesto actual, pegado a las guías y a la cuadrícula si el imán está activo. */
  const snappedEdges = (current: DragState, e: PointerEvent<HTMLElement>): Edges => {
    const dx = (e.clientX - current.startX) / current.scale;
    const dy = (e.clientY - current.startY) / current.scale;
    const edges = shiftEdges(current.start, current.sides, dx, dy);

    if (!settings.snap || e.ctrlKey) {
      setGuides(NO_GUIDES);
      return edges;
    }
    const snapped = snapEdges({ edges, sides: current.sides, references: snapReferences(current.id), grid: settings.grid });
    setGuides(snapped.guides);
    return snapped.edges;
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current) return;

    const travelled = Math.hypot(e.clientX - current.startX, e.clientY - current.startY);
    if (!current.moved && travelled < DRAG_THRESHOLD) return;
    current.moved = true;

    const edges = snappedEdges(current, e);
    if (current.resizing) {
      commands.resize(current.id, planResize({ elements, id: current.id, edges, sides: current.sides, size, backdropGrowsSection }));
      return;
    }

    const plan = planMove({ elements, id: current.id, edges, pointer: canvasPoint(e, current.scale), size, allowDock: !e.altKey });
    current.corner = plan.corner;
    updateDrop(plan.drop);
    commands.move(current.id, plan.corner.x, plan.corner.y);
  };

  const endDrag = () => {
    const current = drag.current;
    drag.current = null;
    const target = latestDrop.current;
    setGuides(NO_GUIDES);
    updateDrop(null);

    // Al soltar sobre un contenedor, el elemento queda acoplado: en su casilla, o donde se soltó.
    if (!current?.moved || !target) return;
    const anchor: DockAnchor = target.slot
      ? { slot: target.slot }
      : { offset: { x: current.corner.x - target.parent.x, y: current.corner.y - target.parent.y } };
    commands.dock(current.id, target.parent.id, anchor);
  };

  return { guides, drop, startDrag, onPointerMove, endDrag };
}

export type CanvasGestures = ReturnType<typeof useCanvasGestures>;
