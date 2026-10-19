"use client";

import { useRef, type Dispatch } from "react";
import { ElementHandles } from "../canvas-editing/element-handles";
import { EditingLayer } from "../canvas-editing/editing-layer";
import { useCanvasSettings } from "../canvas-editing/settings-context";
import { useCanvasGestures } from "../canvas-editing/use-canvas-gestures";
import { ElementContent } from "../site/component-view";
import { builderCommands } from "./builder-commands";
import type { BuilderAction, BuilderState } from "./builder-reducer";
import { handleCanvasKey } from "./canvas-keys";

interface BuilderCanvasProps {
  state: BuilderState;
  dispatch: Dispatch<BuilderAction>;
}

/** Lienzo del componente: dibuja los elementos y sus manijas; los gestos viven en `useCanvasGestures`. */
export function BuilderCanvas({ state, dispatch }: BuilderCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { settings } = useCanvasSettings();
  const size = { width: state.width, height: state.height };
  const { guides, drop, startDrag, onPointerMove, endDrag } = useCanvasGestures({
    size,
    elements: state.elements,
    settings,
    commands: builderCommands(dispatch),
    canvasRef,
  });

  return (
    <div
      ref={canvasRef}
      role="group"
      aria-label={`Lienzo del componente, ${state.width} por ${state.height} píxeles`}
      tabIndex={0}
      onKeyDown={(e) => handleCanvasKey(e, state.selectedId, dispatch)}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerDown={(e) => e.target === e.currentTarget && dispatch({ type: "select", id: null })}
      className="relative mx-auto bg-white shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      style={size}
    >
      {state.elements.map((element) => {
        const selected = element.id === state.selectedId;

        return (
          <div
            key={element.id}
            onPointerDown={(e) => {
              canvasRef.current?.focus(); // para que las flechas y Supr actúen sobre el lienzo
              startDrag(e, element);
            }}
            className={`absolute cursor-move touch-none select-none ${
              selected ? "outline-2 outline-accent" : "hover:outline-1 hover:outline-accent/60"
            }`}
            style={{ left: element.x, top: element.y, width: element.width, height: element.height }}
          >
            <div className="pointer-events-none h-full w-full">
              <ElementContent element={element} />
            </div>

            {selected && <ElementHandles onStart={(e, handle) => startDrag(e, element, handle)} />}
          </div>
        );
      })}

      <EditingLayer
        gestures={{ guides, drop }}
        size={size}
        active
        onResize={(next) => dispatch({ type: "meta", patch: next })}
      />

      {state.elements.length === 0 && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-slate-400">
          Lienzo vacío. Agrega elementos con la barra de la izquierda o carga una plantilla.
        </p>
      )}
    </div>
  );
}
