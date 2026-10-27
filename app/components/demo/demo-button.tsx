"use client";

import { useRef, useState } from "react";
import { useSite, useSiteDispatch } from "../site/site-context";
import { CANVAS_SURFACE_ID } from "../viewport/fit-zoom";
import { useViewport } from "../viewport/viewport-context";
import { pointInPage, scrollNeeded } from "./demo-cursor";
import { buildDemo } from "./demo-script";
import type { DemoStep } from "./demo-types";

/** Cuánto tarda el cursor en llegar a cada pieza y cuánto espera después de actuar. */
const MOVE_MS = 380;
const AFTER_MS = 140;
const DEMO_ZOOM = 25;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Dónde queda en la pantalla la zona de un paso; si no se ve, antes se desplaza el lienzo hasta ella. */
async function aim(target: NonNullable<DemoStep["target"]>): Promise<{ x: number; y: number } | null> {
  const page = document.querySelector<HTMLElement>(`[data-page-id="${target.pageId}"] [data-site-page]`);
  const surface = document.getElementById(CANVAS_SURFACE_ID);
  if (!page || !surface) return null;

  const measure = () => {
    const box = page.getBoundingClientRect();
    return pointInPage({ left: box.left, top: box.top, width: box.width, designWidth: page.offsetWidth }, target.frame);
  };
  const view = surface.getBoundingClientRect();
  const scroll = scrollNeeded(measure().y, view);
  if (scroll !== 0) {
    surface.scrollBy({ top: scroll });
    await sleep(60);
  }
  return measure();
}

/**
 * «Demo»: arma la página de ejemplo paso a paso, con las mismas acciones que haría una persona en el editor y un
 * cursor que se mueve a cada pieza para poder seguir el proceso. Se puede detener en cualquier momento.
 */
export function DemoButton() {
  const site = useSite();
  const dispatch = useSiteDispatch();
  const { setZoom } = useViewport();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const stopped = useRef(false);

  const play = async () => {
    const steps = buildDemo(site);
    stopped.current = false;
    setZoom(DEMO_ZOOM);
    await sleep(300);

    for (const [index, step] of steps.entries()) {
      if (stopped.current) break;
      if (step.target) {
        const point = await aim(step.target);
        if (point) setCursor(point);
        await sleep(MOVE_MS);
      }
      dispatch(step.action);
      setProgress({ done: index + 1, total: steps.length });
      await sleep(AFTER_MS);
    }
    setCursor(null);
    setProgress(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={progress ? () => (stopped.current = true) : play}
        title="Arma la página de ejemplo paso a paso, con un cursor que muestra cada acción"
        className="my-2 flex items-center gap-1.5 self-center rounded-md border border-line px-3 text-xs hover:bg-hover"
      >
        {progress ? `■ Detener · ${progress.done}/${progress.total}` : "▶ Demo"}
      </button>
      {cursor && (
        <svg
          aria-hidden
          width="22"
          height="22"
          viewBox="0 0 24 24"
          className="pointer-events-none fixed z-[70] drop-shadow-lg transition-[left,top] duration-300 ease-out"
          style={{ left: cursor.x, top: cursor.y }}
        >
          <path d="M4 3l16 7-7 2-2 7z" fill="white" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )}
    </>
  );
}
