import { describe, expect, it } from "vitest";
import type { SiteState } from "../site/types";
import { pageMoveActions } from "./move-page";

const item = (src: string) => ({ id: `i-${src}`, kind: "image", src });
const site = {
  pages: [
    { id: "p1", name: "Uno", unitId: "u1", media: [item("a.png"), item("b.png"), item("c.png")], blocks: [] },
    { id: "p2", name: "Dos", unitId: "u1", media: [item("b.png")], blocks: [] },
    { id: "p3", name: "Tres", media: [], blocks: [] },
  ],
  projectMedia: [
    { id: "a", name: "a", src: "a.png", kind: "image", createdAt: 1, unitId: "u1" },
    { id: "b", name: "b", src: "b.png", kind: "image", createdAt: 1, unitId: "u1" },
    { id: "c", name: "c", src: "c.png", kind: "image", createdAt: 1, unitId: "u2" },
    { id: "d", name: "d", src: "d.png", kind: "image", createdAt: 1, unitId: "u1" },
  ],
  components: [],
} as unknown as SiteState;

describe("pageMoveActions", () => {
  it("mueve la página y los medios que solo usa ella y son de su misma unidad", () => {
    expect(pageMoveActions(site, "p1", "u2")).toEqual([
      { type: "page/set-unit", pageId: "p1", unitId: "u2" },
      { type: "project-media/set-unit", id: "a", unitId: "u2" },
    ]);
  });

  it("no mueve medios que usa otra página, que son de otra unidad o que no usa nadie", () => {
    const ids = pageMoveActions(site, "p1", "u2").flatMap((action) => (action.type === "project-media/set-unit" ? [action.id] : []));
    expect(ids).not.toContain("b");
    expect(ids).not.toContain("c");
    expect(ids).not.toContain("d");
  });

  it("enviar a lo global (null) también se admite", () => {
    expect(pageMoveActions(site, "p1", null)[0]).toEqual({ type: "page/set-unit", pageId: "p1", unitId: null });
  });

  it("una página global solo se mueve a sí misma (sus medios globales no se tocan)", () => {
    expect(pageMoveActions(site, "p3", "u1")).toEqual([{ type: "page/set-unit", pageId: "p3", unitId: "u1" }]);
  });

  it("si la página ya es de esa unidad o no existe, no hay nada que hacer", () => {
    expect(pageMoveActions(site, "p1", "u1")).toEqual([]);
    expect(pageMoveActions(site, "nada", "u2")).toEqual([]);
  });
});
