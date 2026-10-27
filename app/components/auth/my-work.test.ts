import { describe, expect, it } from "vitest";
import { hasWorkIn, workOf } from "./my-work";

const pages = [
  { id: "inicio", name: "Inicio", blocks: [{ id: "b1", componentId: "hero" }, { id: "b2", componentId: "pie" }] },
  { id: "tipos", name: "Tipos", blocks: [{ id: "b3", componentId: "tabla" }] },
  { id: "otra", name: "Otra", blocks: [{ id: "b4", componentId: "x" }] },
];
const nameOf = (id: string) => id.toUpperCase();

describe("workOf", () => {
  it("sin límite no hay nada que listar", () => {
    expect(workOf(null, pages, nameOf)).toEqual([]);
  });

  it("una página entera lista todas sus secciones", () => {
    const [work] = workOf({ pageIds: ["inicio"], blockIds: [] }, pages, nameOf);
    expect(work).toMatchObject({ pageId: "inicio", whole: true });
    expect(work.blocks.map((b) => b.label)).toEqual(["1. HERO", "2. PIE"]);
  });

  it("las secciones sueltas aparecen bajo su página, y las demás páginas no", () => {
    const works = workOf({ pageIds: [], blockIds: ["b2", "b3"] }, pages, nameOf);
    expect(works.map((w) => [w.pageId, w.whole, w.blocks.map((b) => b.id)])).toEqual([
      ["inicio", false, ["b2"]],
      ["tipos", false, ["b3"]],
    ]);
  });

  it("sin nada asignado la lista queda vacía y ninguna página tiene trabajo", () => {
    const scope = { pageIds: [], blockIds: [] };
    const works = workOf(scope, pages, nameOf);
    expect(works).toEqual([]);
    expect(hasWorkIn(scope, "inicio", works)).toBe(false);
  });

  it("hasWorkIn es verdadero sin límite", () => {
    expect(hasWorkIn(null, "inicio", [])).toBe(true);
  });
});
