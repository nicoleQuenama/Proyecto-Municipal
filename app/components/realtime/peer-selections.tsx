"use client";

import { useEffect, useMemo, useState } from "react";
import { CANVAS_SURFACE_ID } from "../viewport/fit-zoom";
import { useBranch } from "../versioning/branch-context";
import { useRealtime } from "./realtime-context";

interface Box {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  name: string;
  moving: boolean;
}

/** Cuánto tiempo, tras dejar de moverse, se sigue marcando «moviendo». */
const MOVING_MS = 700;

/**
 * Las secciones que las demás personas tienen seleccionadas, marcadas con su color y su nombre; si una de ellas está
 * cambiando de sitio o de tamaño, lo dice. Se miden en pantalla en cada cuadro, así siguen al desplazamiento y al zoom.
 */
export function PeerSelections() {
  const { peers } = useRealtime();
  const branch = useBranch()?.branch;
  const targets = useMemo(() => peers.filter((peer) => peer.branch === branch).flatMap((peer) => peer.selection.map((id) => ({ peer, id }))), [peers, branch]);
  const [view, setView] = useState<{ clip: string; boxes: Box[] }>({ clip: "", boxes: [] });

  useEffect(() => {
    if (targets.length === 0) return;
    const lastMoved = new Map<string, { signature: string; at: number }>();
    let frame = 0;
    const tick = () => {
      const surface = document.getElementById(CANVAS_SURFACE_ID)?.getBoundingClientRect();
      const now = performance.now();
      const boxes = surface
        ? targets.flatMap(({ peer, id }): Box[] => {
            const element = document.querySelector(`[data-block-id="${CSS.escape(id)}"]`);
            if (!element) return [];
            const rect = element.getBoundingClientRect();
            const key = `${peer.id}:${id}`;
            const signature = `${Math.round(rect.left)},${Math.round(rect.top)},${Math.round(rect.width)},${Math.round(rect.height)}`;
            const before = lastMoved.get(key);
            if (!before || before.signature !== signature) lastMoved.set(key, { signature, at: before ? now : 0 });
            return [{ key, x: rect.left, y: rect.top, w: rect.width, h: rect.height, color: peer.color, name: peer.name, moving: now - (lastMoved.get(key)?.at ?? 0) < MOVING_MS }];
          })
        : [];
      const clip = surface ? `inset(${surface.top}px ${window.innerWidth - surface.right}px ${window.innerHeight - surface.bottom}px ${surface.left}px)` : "";
      const next = { clip, boxes };
      setView((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [targets]);

  // Sin nadie seleccionando no se muestra nada (aunque la última medida siga guardada).
  if (targets.length === 0 || view.boxes.length === 0) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30" style={{ clipPath: view.clip }}>
      {view.boxes.map((box) => (
        <div key={box.key} className="absolute rounded-sm" style={{ left: box.x, top: box.y, width: box.w, height: box.h, outline: `2px solid ${box.color}`, outlineOffset: 1 }}>
          <span className="absolute -top-5 left-0 whitespace-nowrap rounded-t px-1.5 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: box.color }}>
            {box.name}
            {box.moving && " · moviendo"}
          </span>
        </div>
      ))}
    </div>
  );
}
