"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { VIEW_PADDING, clampZoom, fitScale, scrollAfterZoom, stepZoom, wheelZoom } from "./builder-zoom";

interface Size {
  width: number;
  height: number;
}

/** Atajos de teclado del zoom (con Ctrl o ⌘): la tecla y qué hace con el zoom actual. */
const ZOOM_KEYS: Record<string, (zoom: number) => number | "fit"> = {
  "+": (zoom) => stepZoom(zoom, 1),
  "=": (zoom) => stepZoom(zoom, 1),
  "-": (zoom) => stepZoom(zoom, -1),
  "0": () => "fit",
};

/** El zoom del lienzo del constructor: botones, Ctrl+rueda y Ctrl +/−/0; arranca ajustado a la ventana. */
export function useBuilderZoom(viewport: RefObject<HTMLDivElement | null>, canvas: Size) {
  const [zoom, setZoomState] = useState(1);
  const [fitted, setFitted] = useState(true);
  // Al cambiar el zoom, el scroll se corrige para que el punto bajo el cursor no se mueva.
  const anchor = useRef<{ x: number; y: number; from: number } | null>(null);
  const current = useRef(1);

  const setZoomAt = useCallback(
    (next: number, cursor?: { x: number; y: number }) => {
      const box = viewport.current;
      const target = clampZoom(next);
      if (box && target !== current.current) {
        anchor.current = { x: cursor?.x ?? box.clientWidth / 2, y: cursor?.y ?? box.clientHeight / 2, from: current.current };
      }
      current.current = target;
      setFitted(false);
      setZoomState(target);
    },
    [viewport],
  );

  const fittedRef = useRef(fitted);
  const canvasRef = useRef(canvas);
  useEffect(() => {
    fittedRef.current = fitted;
    canvasRef.current = canvas;
  });

  const fit = useCallback(() => {
    const box = viewport.current;
    if (!box) return;
    anchor.current = null;
    const target = fitScale({ width: box.clientWidth, height: box.clientHeight }, canvasRef.current);
    current.current = target;
    setFitted(true);
    setZoomState(target);
    box.scrollTo(0, 0);
  }, [viewport]);

  useLayoutEffect(() => {
    const box = viewport.current;
    const from = anchor.current;
    if (!box || !from) return;
    anchor.current = null;
    box.scrollLeft = scrollAfterZoom(box.scrollLeft, from.x, from.from, zoom, VIEW_PADDING);
    box.scrollTop = scrollAfterZoom(box.scrollTop, from.y, from.from, zoom, VIEW_PADDING);
  }, [zoom, viewport]);

  // Ajustado: sigue a la ventana cuando cambia de tamaño.
  useEffect(() => {
    const box = viewport.current;
    if (!box) return;
    const refit = () => {
      if (box.clientWidth === 0 || !fittedRef.current) return;
      const target = fitScale({ width: box.clientWidth, height: box.clientHeight }, canvasRef.current);
      current.current = target;
      setZoomState(target);
    };
    refit();
    const observer = new ResizeObserver(refit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [viewport]);

  // Ctrl + rueda: acerca o aleja desde el cursor. La rueda sola desplaza (nativo).
  useEffect(() => {
    const box = viewport.current;
    if (!box) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = box.getBoundingClientRect();
      setZoomAt(wheelZoom(current.current, e.deltaY), { x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    box.addEventListener("wheel", onWheel, { passive: false });
    return () => box.removeEventListener("wheel", onWheel);
  }, [viewport, setZoomAt]);

  // Ctrl +, Ctrl −, Ctrl 0: en captura, para que no cambien el zoom de todo el navegador.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = e.ctrlKey || e.metaKey ? ZOOM_KEYS[e.key] : undefined;
      if (!action) return;
      e.preventDefault();
      e.stopPropagation();
      const next = action(current.current);
      if (next === "fit") fit();
      else setZoomAt(next);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [fit, setZoomAt]);

  return {
    zoom,
    fitted,
    fit,
    zoomIn: () => setZoomAt(stepZoom(current.current, 1)),
    zoomOut: () => setZoomAt(stepZoom(current.current, -1)),
    actualSize: () => setZoomAt(1),
  };
}
