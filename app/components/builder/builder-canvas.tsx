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
import { useCanvasMedia } from "./use-canvas-media";

interface BuilderCanvasProps {
  state: BuilderState;
  dispatch: Dispatch<BuilderAction>;
}

/** Lienzo del componente: dibuja los elementos y sus manijas; los gestos viven en `useCanvasGestures`. */
export function BuilderCanvas({ state, dispatch }: BuilderCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { settings } = useCanvasSettings();
  const size = { width: state.width, height: state.height };
  const media = useCanvasMedia(dispatch, canvasRef);
  // Un clic (sin arrastrar) sobre una imagen vacía que ya estaba seleccionada abre el selector de archivos.
  const press = useRef<{ x: number; y: number; wasSelected: boolean } | null>(null);
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
      {...media.drop(null)}
      className="relative bg-white shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      style={size}
    >
      {state.elements.map((element) => {
        const selected = element.id === state.selectedId;

        return (
          <div
            key={element.id}
            onPointerDown={(e) => {
              canvasRef.current?.focus(); // para que las flechas y Supr actúen sobre el lienzo
              press.current = { x: e.clientX, y: e.clientY, wasSelected: selected };
              startDrag(e, element);
            }}
            onClick={(e) => {
              const down = press.current;
              const still = down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 3;
              if (still && down.wasSelected && element.kind === "image" && !element.src) media.pick(element);
            }}
            {...media.drop(element)}
            className={`absolute cursor-move touch-none select-none ${
              selected ? "outline-2 outline-accent" : "hover:outline-1 hover:outline-accent/60"
            } ${media.overId === element.id ? "bg-accent/20 outline-2 outline-accent" : ""}`}
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

      {media.picker}
      {media.overId === "canvas" && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center bg-accent/10 text-xs text-accent">
          Suelta la imagen para agregarla
        </p>
      )}
      {media.error && (
        <p role="alert" className="absolute inset-x-2 bottom-2 rounded bg-red-500/90 px-2 py-1 text-[11px] text-white">
          {media.error}
        </p>
      )}

      {state.elements.length === 0 && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-slate-400">
          Lienzo vacío. Agrega elementos con la barra de la izquierda o carga una plantilla.
        </p>
      )}
    </div>
  );
}
