"use client";

import { useRef, type Dispatch, type KeyboardEvent, type PointerEvent } from "react";
import { ElementContent } from "../site/component-view";
import type { CanvasElement } from "../site/types";
import type { BuilderAction, BuilderState } from "./builder-reducer";

type DragMode = "move" | "resize";

interface DragState {
  id: string;
  mode: DragMode;
  startX: number;
  startY: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BuilderCanvasProps {
  state: BuilderState;
  dispatch: Dispatch<BuilderAction>;
}

const GRID = {
  backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
  backgroundSize: "16px 16px",
} as const;

/** Lienzo del componente: se selecciona, arrastra y redimensiona cada elemento. */
export function BuilderCanvas({ state, dispatch }: BuilderCanvasProps) {
  const drag = useRef<DragState | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const startDrag = (e: PointerEvent<HTMLElement>, element: CanvasElement, mode: DragMode) => {
    e.stopPropagation();
    canvasRef.current?.focus(); // para que las flechas y Supr actúen sobre el lienzo
    dispatch({ type: "select", id: element.id });

    drag.current = {
      id: element.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current) return;

    const dx = e.clientX - current.startX;
    const dy = e.clientY - current.startY;

    if (current.mode === "move") {
      dispatch({ type: "move", id: current.id, x: current.x + dx, y: current.y + dy });
    } else {
      dispatch({ type: "resize", id: current.id, width: current.width + dx, height: current.height + dy });
    }
  };

  const endDrag = () => {
    drag.current = null;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const id = state.selectedId;
    if (!id) return;

    const step = e.shiftKey ? 10 : 1;
    const nudges: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };

    if (nudges[e.key]) {
      dispatch({ type: "nudge", id, dx: nudges[e.key][0], dy: nudges[e.key][1] });
    } else if (e.key === "Delete" || e.key === "Backspace") {
      dispatch({ type: "remove", id });
    } else {
      return;
    }
    e.preventDefault();
  };

  const dragHandlers = {
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };

  return (
    <div
      ref={canvasRef}
      role="group"
      aria-label={`Lienzo del componente, ${state.width} por ${state.height} píxeles`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => e.target === e.currentTarget && dispatch({ type: "select", id: null })}
      className="relative mx-auto bg-white shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      style={{ width: state.width, height: state.height, ...GRID }}
    >
      {state.elements.map((element) => {
        const selected = element.id === state.selectedId;

        return (
          <div
            key={element.id}
            onPointerDown={(e) => startDrag(e, element, "move")}
            {...dragHandlers}
            className={`absolute cursor-move touch-none select-none ${
              selected ? "outline-2 outline-accent" : "hover:outline-1 hover:outline-accent/60"
            }`}
            style={{ left: element.x, top: element.y, width: element.width, height: element.height }}
          >
            <div className="pointer-events-none h-full w-full">
              <ElementContent element={element} />
            </div>

            {selected && (
              <span
                aria-label="Cambiar tamaño"
                onPointerDown={(e) => startDrag(e, element, "resize")}
                {...dragHandlers}
                className="absolute -right-1.5 -bottom-1.5 h-3 w-3 cursor-nwse-resize touch-none border-2 border-accent bg-white"
              />
            )}
          </div>
        );
      })}

      {state.elements.length === 0 && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-slate-400">
          Lienzo vacío. Agrega elementos con la barra de la izquierda o carga una plantilla.
        </p>
      )}
    </div>
  );
}
