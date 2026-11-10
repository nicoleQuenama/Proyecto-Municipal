import { describe, expect, it } from "vitest";
import type { SiteState } from "../../components/site/types";
import { changedUnitIds } from "./changed-units";

const site = (pages: object[], media: object[] = []) => ({ pages, projectMedia: media }) as unknown as SiteState;
const base = site([{ id: "a", name: "A", unitId: "u1" }, { id: "b", name: "B", unitId: "u2" }, { id: "g", name: "G" }], [{ id: "m1", unitId: "u1" }]);

describe("changedUnitIds", () => {
  it("sin cambios no hay unidades", () => {
    expect(changedUnitIds(base, base)).toEqual([]);
  });

  it("una página editada cuenta con su unidad", () => {
    const edited = site([{ id: "a", name: "A2", unitId: "u1" }, base.pages[1], base.pages[2]], [{ id: "m1", unitId: "u1" }]);
    expect(changedUnitIds(base, edited)).toEqual(["u1"]);
  });

  it("una página nueva cuenta con su unidad, y una global con null", () => {
    expect(changedUnitIds(base, site([...base.pages, { id: "n", name: "N", unitId: "u2" }], base.projectMedia))).toEqual(["u2"]);
    expect(changedUnitIds(base, site([...base.pages, { id: "n2", name: "N" }], base.projectMedia))).toEqual([null]);
  });

  it("una página quitada cuenta con la unidad que tenía", () => {
    expect(changedUnitIds(base, site([base.pages[0], base.pages[2]], base.projectMedia))).toEqual(["u2"]);
  });

  it("mover una página cuenta con las dos unidades", () => {
    const moved = site([{ id: "a", name: "A", unitId: "u2" }, base.pages[1], base.pages[2]], base.projectMedia);
    expect([...changedUnitIds(base, moved)].sort()).toEqual(["u1", "u2"]);
  });

  it("un archivo nuevo de la biblioteca cuenta con su unidad", () => {
    expect(changedUnitIds(base, site(base.pages, [...base.projectMedia!, { id: "m2", unitId: "u2" }]))).toEqual(["u2"]);
  });

  it("sin sitio base (primer envío) todo lo que hay cuenta", () => {
    expect([...changedUnitIds(null, base)].sort()).toEqual(["u1", "u2", null].sort());
  });
});
