"use client";

import { memo, useRef, type Dispatch } from "react";
import { ElementHandles } from "../canvas-editing/element-handles";
import { EditingLayer } from "../canvas-editing/editing-layer";
import { useCanvasSettings } from "../canvas-editing/settings-context";
import { useCanvasGestures, type CanvasCommands } from "../canvas-editing/use-canvas-gestures";
import { selectedIdsOf, withoutNested } from "./selection";
import { ElementContent } from "../site/component-view";
import { builderCommands } from "./builder-commands";
import type { BuilderAction, BuilderState } from "./builder-reducer";
import { handleCanvasKey } from "./canvas-keys";
import { useCanvasMedia } from "./use-canvas-media";

/** Al arrastrar solo cambia un elemento: los demás conservan su objeto y no se vuelven a dibujar. */
const StaticContent = memo(ElementContent);

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
  const selected = selectedIdsOf(state);
  // Dónde dejó el gesto al elemento arrastrado la última vez: de ahí sale cuánto mover a los demás seleccionados.
  const lastDragged = useRef<{ id: string; x: number; y: number } | null>(null);
  const base = builderCommands(dispatch);
  const commands: CanvasCommands = {
    ...base,
    // Arrastrar uno de varios seleccionados no rompe la selección.
    select: (id) => (selected.length > 1 && selected.includes(id) ? undefined : base.select(id)),
    move: (id, x, y) => {
      const from = lastDragged.current?.id === id ? lastDragged.current : state.elements.find((e) => e.id === id);
      lastDragged.current = { id, x, y };
      base.move(id, x, y);
      if (!from || !selected.includes(id)) return;
      const others = withoutNested(state.elements, selected).filter((other) => other !== id);
      others.forEach((other) => dispatch({ type: "nudge", id: other, dx: x - from.x, dy: y - from.y }));
    },
  };
  const gestures = useCanvasGestures({ size, elements: state.elements, settings, commands, canvasRef });
  const { guides, drop, startDrag, onPointerMove } = gestures;
  const endDrag = () => {
    lastDragged.current = null;
    gestures.endDrag();
  };

  return (
    <div
      ref={canvasRef}
      role="group"
      aria-label={`Lienzo del componente, ${state.width} por ${state.height} píxeles`}
      tabIndex={0}
      onKeyDown={(e) => handleCanvasKey(e, state, dispatch)}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerDown={(e) => e.target === e.currentTarget && dispatch({ type: "select", id: null })}
      {...media.drop(null)}
      className="relative bg-white shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      style={size}
    >
      {state.elements.map((element) => {
        const isSelected = selected.includes(element.id);
        const isPrimary = element.id === state.selectedId;

        return (
          <div
            key={element.id}
            onPointerDown={(e) => {
              canvasRef.current?.focus(); // para que las flechas y Supr actúen sobre el lienzo
              press.current = { x: e.clientX, y: e.clientY, wasSelected: isPrimary };
              // Ctrl/⌘/Mayús-clic suma o quita el elemento de la selección, sin arrastrar.
              if (e.ctrlKey || e.metaKey || e.shiftKey) {
                e.stopPropagation();
                dispatch({ type: "select", id: element.id, additive: true });
                return;
              }
              startDrag(e, element);
            }}
            onClick={(e) => {
              const down = press.current;
              const still = down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 3;
              if (still && down.wasSelected && (element.kind === "image" || element.frame || (element.kind === "rect" || element.kind === "ellipse") && element.role === "image") && !element.src) {
                media.pick(element);
              }
            }}
            {...media.drop(element)}
            className={`absolute cursor-move touch-none select-none ${
              isSelected ? "outline-2 outline-accent" : "hover:outline-1 hover:outline-accent/60"
            } ${media.overId === element.id ? "bg-accent/20 outline-2 outline-accent" : ""}`}
            style={{ left: element.x, top: element.y, width: element.width, height: element.height }}
          >
            <div className="pointer-events-none h-full w-full">
              <StaticContent element={element} />
            </div>

            {isPrimary && selected.length === 1 && <ElementHandles onStart={(e, handle) => startDrag(e, element, handle)} />}
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
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-slate-400">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          <p className="text-xs font-medium text-slate-500">Lienzo en blanco</p>
          <p className="text-[11px] max-w-[220px] text-slate-400 leading-relaxed">
            Agrega marcos, formas, textos o botones desde la barra izquierda para diseñar tu componente.
          </p>
        </div>
      )}
    </div>
  );
}
