"use client";

import { useSite, useSiteDispatch } from "../site/site-context";
import type { Page } from "../site/types";
import { externalLinkCount, flowEdges } from "./links";
import { routeOf } from "../site/rules";
import { DROP_ATTRIBUTE, EXTERNAL_DROP, pageDrop, useNavigation } from "./navigation-context";

const WIDTH = 300;
const HEIGHT = 230;
const NODE_W = 84;
const NODE_H = 30;
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };
const RADIUS = { x: 100, y: 78 };

interface Point {
  x: number;
  y: number;
}

/** Las páginas repartidas en una elipse; con una sola, en el centro. */
function layout(count: number): Point[] {
  if (count === 1) return [CENTER];
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / count;
    return { x: CENTER.x + RADIUS.x * Math.cos(angle), y: CENTER.y + RADIUS.y * Math.sin(angle) };
  });
}

/** El punto del borde del recuadro de una página, en dirección a otro punto. */
function borderToward(center: Point, target: Point): Point {
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  const scale = Math.min(
    dx === 0 ? Infinity : (NODE_W / 2 + 3) / Math.abs(dx),
    dy === 0 ? Infinity : (NODE_H / 2 + 3) / Math.abs(dy),
  );
  return { x: center.x + dx * scale, y: center.y + dy * scale };
}

const shortName = (page: Page) => (page.name.length > 11 ? `${page.name.slice(0, 10)}…` : page.name);

/** Mapa de las páginas y de a dónde llevan los enlaces. Cada página es un destino donde soltar una flecha. */
export function FlowMap() {
  const { pages, components, currentPageId } = useSite();
  const dispatch = useSiteDispatch();
  const { hotDrop, connecting } = useNavigation();

  const points = layout(pages.length);
  const positionOf = new Map(pages.map((page, index) => [page.id, points[index]]));
  const edges = flowEdges(pages, components);

  return (
    <div className="flex flex-col gap-2">
      <svg
        role="img"
        aria-label="Mapa de navegación entre páginas"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full rounded-lg border border-line bg-canvas"
      >
        <defs>
          <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
          </marker>
        </defs>

        {edges.map((edge) => {
          const from = positionOf.get(edge.from)!;
          const to = positionOf.get(edge.to)!;
          const start = borderToward(from, to);
          const end = borderToward(to, from);

          // Las flechas de ida y de vuelta se curvan hacia lados opuestos para no taparse.
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const length = Math.hypot(dx, dy) || 1;
          const bend = 16;
          const control = {
            x: (start.x + end.x) / 2 - (dy / length) * bend,
            y: (start.y + end.y) / 2 + (dx / length) * bend,
          };
          const fromCurrent = edge.from === currentPageId;

          return (
            <path
              key={`${edge.from}->${edge.to}`}
              d={`M${start.x},${start.y} Q${control.x},${control.y} ${end.x},${end.y}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={fromCurrent ? 1.8 : 1.1}
              markerEnd="url(#flow-arrow)"
              className={fromCurrent ? "text-accent" : "text-ink-dim opacity-50"}
            />
          );
        })}

        {pages.map((page) => {
          const point = positionOf.get(page.id)!;
          const isCurrent = page.id === currentPageId;
          const isHot = hotDrop === pageDrop(page.id);
          const external = externalLinkCount(page, components);
          const select = () => dispatch({ type: "page/select", id: page.id });

          return (
            <g
              key={page.id}
              {...{ [DROP_ATTRIBUTE]: pageDrop(page.id) }}
              role="button"
              tabIndex={0}
              aria-label={`Página ${page.name}${connecting ? ": soltar aquí para enlazar" : ""}`}
              aria-current={isCurrent ? "page" : undefined}
              onClick={select}
              onKeyDown={(e) => e.key === "Enter" && select()}
              className="cursor-pointer outline-none"
            >
              <rect
                x={point.x - NODE_W / 2}
                y={point.y - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                rx="8"
                strokeWidth={isHot ? 3 : 1.5}
                strokeDasharray={page.route ? "4 2" : undefined}
                className={
                  isHot
                    ? "fill-green-500/25 stroke-green-400"
                    : isCurrent
                      ? "fill-accent/25 stroke-accent"
                      : "fill-panel stroke-line"
                }
              />
              <title>{`${page.name} · ${routeOf(page)}`}</title>
              <text
                x={point.x}
                y={point.y + (page.route ? 0 : 4)}
                textAnchor="middle"
                fontSize="11"
                className="pointer-events-none fill-ink"
              >
                {shortName(page)}
              </text>
              {page.route && (
                <text x={point.x} y={point.y + 10} textAnchor="middle" fontSize="7" className="pointer-events-none fill-ink-dim">
                  {routeOf(page).length > 18 ? `${routeOf(page).slice(0, 17)}…` : routeOf(page)}
                </text>
              )}
              {external > 0 && (
                <text
                  x={point.x + NODE_W / 2 - 2}
                  y={point.y - NODE_H / 2 - 3}
                  textAnchor="end"
                  fontSize="9"
                  className="pointer-events-none fill-ink-dim"
                >
                  ↗ {external}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div
        {...{ [DROP_ATTRIBUTE]: EXTERNAL_DROP }}
        className={`rounded-lg border border-dashed px-3 py-2.5 text-center text-xs transition-colors ${
          hotDrop === EXTERNAL_DROP
            ? "border-green-400 bg-green-500/15 text-green-300"
            : "border-line text-ink-dim"
        }`}
      >
        Suelta aquí una flecha para un <strong>enlace externo ↗</strong>
      </div>
    </div>
  );
}
