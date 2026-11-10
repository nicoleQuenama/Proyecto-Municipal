import { describe, expect, it } from "vitest";
import type { SiteState } from "../../components/site/types";
import { filterSiteForUnits } from "./filter-site";

const site = {
  currentPageId: "ps",
  pages: [
    { id: "pz", unitId: "u1" },
    { id: "ps", unitId: "u2" },
    { id: "pg" },
  ],
  projectMedia: [{ id: "m1", unitId: "u1" }, { id: "m2", unitId: "u2" }, { id: "m3" }],
  comments: [{ id: "c1", pageId: "pz" }, { id: "c2", pageId: "ps" }],
  variables: [
    { id: "v1", scope: { kind: "page", pageId: "ps" } },
    { id: "v2", scope: { kind: "global" } },
    { id: "v3", scope: { kind: "page", pageId: "pz" } },
  ],
  rules: [{ scope: { kind: "page", pageId: "ps" }, target: "a" }, { scope: { kind: "global" }, target: "b" }],
  components: [{ id: "navbar" }],
} as unknown as SiteState;

const ids = (list: readonly { id: string }[] | undefined) => (list ?? []).map((item) => item.id);

describe("filterSiteForUnits", () => {
  it("sin unidades devuelve el sitio tal cual", () => {
    expect(filterSiteForUnits(site, { scoped: false })).toBe(site);
  });

  it("deja las páginas de la unidad y las globales, y quita las de otra", () => {
    const seen = filterSiteForUnits(site, { scoped: true, unitIds: ["u1"], canEditGlobal: false });
    expect(ids(seen.pages)).toEqual(["pz", "pg"]);
  });

  it("con varias unidades ve las de todas ellas", () => {
    const seen = filterSiteForUnits(site, { scoped: true, unitIds: ["u1", "u2"], canEditGlobal: false });
    expect(ids(seen.pages)).toEqual(["pz", "ps", "pg"]);
  });

  it("quita los medios, comentarios y estilos de página de otra unidad", () => {
    const seen = filterSiteForUnits(site, { scoped: true, unitIds: ["u1"], canEditGlobal: false });
    expect(ids(seen.projectMedia)).toEqual(["m1", "m3"]);
    expect(ids(seen.comments)).toEqual(["c1"]);
    expect(ids(seen.variables)).toEqual(["v2", "v3"]);
    expect(seen.rules).toHaveLength(1);
  });

  it("deja lo global intacto (componentes)", () => {
    expect(ids(filterSiteForUnits(site, { scoped: true, unitIds: ["u1"], canEditGlobal: false }).components)).toEqual(["navbar"]);
  });

  it("si la página actual no es visible pasa a la primera visible", () => {
    expect(filterSiteForUnits(site, { scoped: true, unitIds: ["u1"], canEditGlobal: false }).currentPageId).toBe("pz");
  });

  it("una persona sin ninguna unidad solo ve lo global", () => {
    expect(ids(filterSiteForUnits(site, { scoped: true, unitIds: [], canEditGlobal: false }).pages)).toEqual(["pg"]);
  });
});
