"use client";

import { useMemo, useRef, type Dispatch } from "react";
import { BuilderCanvas } from "./builder-canvas";
import type { BuilderAction, BuilderState } from "./builder-reducer";
import { VIEW_PADDING } from "./builder-zoom";
import { CanvasToolbar } from "./canvas-toolbar";
import { usePan } from "./use-pan";
import { useBuilderZoom } from "./use-builder-zoom";
import { ZoomBar } from "./zoom-bar";

/** La zona del lienzo: barra de zoom, ventana con desplazamiento y el lienzo escalado dentro. */
export function BuilderStage({ state, dispatch }: { state: BuilderState; dispatch: Dispatch<BuilderAction> }) {
  const viewport = useRef<HTMLDivElement>(null);
  const size = useMemo(() => ({ width: state.width, height: state.height }), [state.width, state.height]);
  const zoom = useBuilderZoom(viewport, size);
  const pan = usePan(viewport);

  return (
    <div className="flex min-h-0 min-w-0 flex-col bg-canvas">
      <CanvasToolbar
        size={size}
        zoomBar={<ZoomBar {...zoom} hand={pan.hand} onToggleHand={() => pan.setHand(!pan.hand)} onZoomIn={zoom.zoomIn} onZoomOut={zoom.zoomOut} onFit={zoom.fit} onActualSize={zoom.actualSize} />}
      />

      <div
        ref={viewport}
        aria-label="Ventana del lienzo"
        className="min-h-0 flex-1 overflow-auto"
        style={{ cursor: pan.cursor }}
        {...pan.handlers}
      >
        <div
          className="flex min-h-full min-w-full"
          style={{ width: size.width * zoom.zoom + 2 * VIEW_PADDING, padding: VIEW_PADDING }}
        >
          {/* La caja ocupa el tamaño ya escalado; el lienzo se dibuja a escala real y se reduce con transform. */}
          <div className="m-auto shrink-0" style={{ width: size.width * zoom.zoom, height: size.height * zoom.zoom }}>
            <div style={{ width: size.width, height: size.height, transform: `scale(${zoom.zoom})`, transformOrigin: "0 0" }}>
              <BuilderCanvas state={state} dispatch={dispatch} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
