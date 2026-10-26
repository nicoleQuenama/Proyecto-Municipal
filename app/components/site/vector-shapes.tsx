import { linePoints } from "./line-points";
import type { CanvasElement } from "./types";

/** El color de la figura: el propio, o `currentColor` cuando lo pone el contenedor (ver `element-style.ts`). */
const paint = (element: CanvasElement, inherit: boolean) => (inherit ? "currentColor" : element.fill);

const svgProps = { viewBox: "0 0 100 100", preserveAspectRatio: "none", className: "block h-full w-full overflow-visible" } as const;

/** Un triángulo isósceles que llena su caja. */
export function TriangleShape({ element, inherit }: { element: CanvasElement; inherit: boolean }) {
  return (
    <svg {...svgProps} aria-hidden>
      <polygon points="50,0 100,100 0,100" fill={paint(element, inherit)} />
    </svg>
  );
}

/** Una línea recta dentro de su caja; el grosor no se deforma al estirar la caja. */
export function LineShape({ element, inherit }: { element: CanvasElement; inherit: boolean }) {
  const { x1, y1, x2, y2 } = linePoints(element);
  return (
    <svg {...svgProps} aria-hidden>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={paint(element, inherit)}
        strokeWidth={element.strokeWidth ?? 3}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
