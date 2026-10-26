import type { CanvasElement, ElementKind } from "../site/types";
import type { Tool } from "../viewport/viewport-context";

/** Qué se crea al dibujar con una herramienta del lienzo. Una herramienta nueva es una entrada nueva. */
export interface ShapeSpec {
  kind: ElementKind;
  label: string;
  /** Valores propios de la figura (el marco es un rectángulo claro y recto). */
  overrides?: Partial<CanvasElement>;
}

export const SHAPE_TOOLS: Partial<Record<Tool, ShapeSpec>> = {
  rectangle: { kind: "rect", label: "Rectángulo" },
  ellipse: { kind: "ellipse", label: "Elipse" },
  triangle: { kind: "triangle", label: "Triángulo" },
  line: { kind: "line", label: "Línea" },
  text: { kind: "text", label: "Texto" },
  frame: { kind: "rect", label: "Marco", overrides: { fill: "#f1f5f9", radius: 0 } },
};
