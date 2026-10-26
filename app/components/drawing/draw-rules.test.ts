import { describe, expect, it } from "vitest";
import { INITIAL_SITE } from "../site/initial-site";
import { removeBlocks } from "../site/removal-rules";
import { drawShape, withoutOrphanShapes } from "./draw-rules";

const input = {
  pageId: INITIAL_SITE.pages[0].id,
  blockId: "b1",
  componentId: "c1",
  kind: "rect" as const,
  label: "Rectángulo",
  frame: { x: 100, y: 50, width: 200, height: 120 },
};

describe("drawShape", () => {
  const next = drawShape(INITIAL_SITE, input);

  it("crea un componente de un solo elemento con el tamaño dibujado", () => {
    const def = next.components.find((c) => c.id === "c1")!;
    expect(def.drawn).toBe(true);
    expect(def.elements).toHaveLength(1);
    expect([def.width, def.height]).toEqual([200, 120]);
    expect([def.elements[0].x, def.elements[0].y]).toEqual([0, 0]);
  });

  it("coloca el bloque exactamente donde se dibujó y lo deja seleccionado", () => {
    const block = next.pages[0].blocks.find((b) => b.id === "b1")!;
    expect(block.placement).toMatchObject({ x: 100, y: 50 });
    expect(next.selectedId).toBe("b1");
  });

  it("una línea recta conserva un grosor mínimo de caja", () => {
    const line = drawShape(INITIAL_SITE, { ...input, kind: "line", frame: { x: 10, y: 10, width: 300, height: 0 } });
    expect(line.components.find((c) => c.id === "c1")!.height).toBeGreaterThan(0);
  });

  it("al borrar el bloque, la figura huérfana se va con él", () => {
    const removed = withoutOrphanShapes(removeBlocks(next, ["b1"]));
    expect(removed.components.some((c) => c.id === "c1")).toBe(false);
  });
});
