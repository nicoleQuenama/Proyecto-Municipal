"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { useSite, useSiteDispatch } from "../site/site-context";
import {
  addStop,
  angleOf,
  defaultGradient,
  lineLength,
  moveStop,
  parseGradient,
  pointAt,
  positionOf,
  removeStop,
  setAngle,
  setStopColor,
  toCss,
  type Gradient,
  type Point,
} from "./gradient-model";
import { backgroundAction, currentBackground } from "./gradient-target";
import { GradientPanel } from "./gradient-panel";
import type { GradientTarget } from "./types";

/** Cuánto sobresale del extremo el círculo que gira el degradado (px de pantalla). */
const ROTATE_REACH = 30;
const HEX = /^#[0-9a-f]{6}$/i;

/** El elemento del DOM sobre el que se pinta el degradado. */
function domOf(target: GradientTarget): Element | null {
  if (target.kind === "page") return document.querySelector(`[data-page-id="${target.pageId}"] [data-site-page]`);
  const block = `[data-block-id="${target.blockId}"]`;
  return document.querySelector(target.kind === "block" ? block : `${block} [data-el="${target.elementId}"]`);
}

/**
 * El editor de degradado sobre el lienzo: una línea con un círculo por cada color (se arrastran para moverlos), otro
 * círculo para girar el ángulo, y un panel para el color del punto elegido. Cambia la página, la sección o el
 * elemento al momento.
 */
export function GradientLayer({ target, onClose }: { target: GradientTarget; onClose: () => void }) {
  const site = useSite();
  const dispatch = useSiteDispatch();
  const [gradient, setGradient] = useState<Gradient>(() => {
    const now = currentBackground(site, target);
    return parseGradient(now) ?? defaultGradient(HEX.test(now ?? "") ? now : undefined);
  });
  const [selected, setSelected] = useState(0);
  const current = useRef(gradient);
  const started = useRef(false);
  const [, refresh] = useReducer((n: number) => n + 1, 0);

  const apply = (next: Gradient) => {
    current.current = next;
    setGradient(next);
    dispatch(backgroundAction(target, toCss(next)));
  };
  const edit = (change: (g: Gradient) => Gradient) => apply(change(current.current));

  // Al abrirlo ya se ve: el degradado propuesto se aplica de una vez.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    dispatch(backgroundAction(target, toCss(gradient)));
  }, [dispatch, target, gradient]);

  // La caja se mueve con el scroll y el zoom: se vuelve a medir.
  useEffect(() => {
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);
    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
    };
  }, []);

  const box = domOf(target)?.getBoundingClientRect();
  if (!box) return null;
  const center: Point = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  const length = Math.max(1, lineLength(box.width, box.height, gradient.angle));
  const at = (position: number) => pointAt(center, gradient.angle, length, position);
  const pointer = (e: { clientX: number; clientY: number }): Point => ({ x: e.clientX, y: e.clientY });

  const drag = (onMove: (point: Point) => void) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const move = (event: PointerEvent) => onMove(pointer(event));
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  const [from, to] = [at(0), at(100)];
  const outward = { x: (to.x - center.x) / (length / 2 || 1), y: (to.y - center.y) / (length / 2 || 1) };
  const rotate = { x: to.x + outward.x * ROTATE_REACH, y: to.y + outward.y * ROTATE_REACH };

  return (
    <div data-gradient-ui className="pointer-events-none fixed inset-0 z-50">
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="rgba(0,0,0,0.45)" strokeWidth={4} />
        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="white" strokeWidth={2} />
        {/* Una franja más ancha e invisible: pulsar en la línea añade un punto de color. */}
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="transparent"
          strokeWidth={14}
          className="pointer-events-auto cursor-copy"
          onPointerDown={(e) => {
            e.stopPropagation();
            edit((g) => addStop(g, positionOf(center, g.angle, length, pointer(e))));
            setSelected(current.current.stops.length - 1);
          }}
        />
        <line x1={to.x} y1={to.y} x2={rotate.x} y2={rotate.y} stroke="white" strokeWidth={1.5} strokeDasharray="3 3" />
      </svg>

      {gradient.stops.map((stop, index) => {
        const point = at(stop.position);
        return (
          <button
            key={index}
            type="button"
            aria-label={`Color ${index + 1}: ${stop.color}, al ${Math.round(stop.position)} %`}
            onPointerDown={(e) => {
              setSelected(index);
              drag((p) => edit((g) => moveStop(g, index, positionOf(center, g.angle, length, p))))(e);
            }}
            className={`pointer-events-auto absolute size-6 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 shadow-lg ${
              index === selected ? "border-white ring-2 ring-accent" : "border-white/80"
            }`}
            style={{ left: point.x, top: point.y, background: stop.color }}
          />
        );
      })}

      <button
        type="button"
        aria-label={`Girar el degradado (${gradient.angle}°)`}
        title="Arrastra para girar el degradado (Mayús: de 15° en 15°)"
        onPointerDown={(e) => drag((p) => edit((g) => setAngle(g, angleOf(center, p))))(e)}
        className="pointer-events-auto absolute flex size-5 -translate-x-1/2 -translate-y-1/2 cursor-alias items-center justify-center rounded-full border-2 border-white bg-black/70 text-[10px] text-white shadow-lg"
        style={{ left: rotate.x, top: rotate.y }}
      >
        ↻
      </button>

      <GradientPanel
        gradient={gradient}
        selected={Math.min(selected, gradient.stops.length - 1)}
        anchor={{ left: box.left, top: box.bottom }}
        onAngle={(angle) => edit((g) => setAngle(g, angle))}
        onColor={(color) => edit((g) => setStopColor(g, selected, color))}
        onAdd={() => {
          edit((g) => addStop(g, 50));
          setSelected(current.current.stops.length - 1);
        }}
        onRemove={() => {
          edit((g) => removeStop(g, selected));
          setSelected(0);
        }}
        onClose={onClose}
      />
    </div>
  );
}
