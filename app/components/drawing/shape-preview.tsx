import type { ElementKind } from "../site/types";
import type { DrawFrame } from "./draw-plan";

/** Cómo se traza cada figura mientras se arrastra (el relleno translúcido y el borde van en el contenedor). */
const OUTLINES: Partial<Record<ElementKind, string>> = {
  ellipse: "rounded-full",
  triangle: "[clip-path:polygon(50%_0,100%_100%,0_100%)]",
};

const TRACE = "border-2 border-accent bg-accent/20";

/** El trazo en vivo, en pantalla: sigue al puntero sobre la página con el zoom del lienzo. */
export function ShapePreview({ kind, frame, origin, scale }: { kind: ElementKind; frame: DrawFrame; origin: DOMRect; scale: number }) {
  const left = origin.left + frame.x * scale;
  const top = origin.top + frame.y * scale;
  const width = frame.width * scale;
  const height = frame.height * scale;

  return (
    <div aria-hidden className="pointer-events-none fixed z-30" style={{ left, top, width, height }}>
      {kind === "line" ? (
        <svg width="100%" height="100%" className="overflow-visible">
          <line
            x1={0}
            y1={frame.flipped ? height : 0}
            x2={width}
            y2={frame.flipped ? 0 : height}
            className="stroke-accent"
            strokeWidth={2}
          />
        </svg>
      ) : (
        <div className={`h-full w-full ${OUTLINES[kind] ?? ""} ${TRACE}`} />
      )}
      <span className="absolute top-full left-0 mt-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] whitespace-nowrap text-white">
        {frame.width} × {frame.height}
      </span>
    </div>
  );
}
