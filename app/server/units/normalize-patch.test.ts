import { describe, expect, it } from "vitest";
import type { SiteState } from "../../components/site/types";
import type { SitePatch } from "../site/site-patch";
import { VersionError } from "../versions/branch-rows";
import { normalizePatchForUnits } from "./normalize-patch";
import type { UnitAccess } from "./types";

const current = {
  pages: [{ id: "pz", unitId: "u1" }, { id: "ps", unitId: "u2" }, { id: "pg" }],
  projectMedia: [{ id: "m1", unitId: "u1" }, { id: "m2", unitId: "u2" }, { id: "m3" }],
  variables: [
    { id: "v-own", scope: { kind: "page", pageId: "pz" }, name: "a", kind: "color", value: "#1" },
    { id: "v-other", scope: { kind: "page", pageId: "ps" }, name: "b", kind: "color", value: "#2" },
    { id: "v-global", scope: { kind: "global" }, name: "c", kind: "color", value: "#3" },
  ],
  rules: [
    { scope: { kind: "page", pageId: "pz" }, target: "t1", props: { color: "red" } },
    { scope: { kind: "page", pageId: "ps" }, target: "t2", props: { color: "blue" } },
    { scope: { kind: "global" }, target: "t3", props: { color: "gray" } },
  ],
} as unknown as SiteState;

const mine: UnitAccess = { scoped: true, unitIds: ["u1"], canEditGlobal: false };
const variables = (list: unknown[]) => ({ variables: list }) as unknown as SitePatch;
const seen = [current.variables[0], current.variables[2]];

describe("normalizePatchForUnits", () => {
  it("sin unidades devuelve el parche tal cual", () => {
    const patch = variables(seen);
    expect(normalizePatchForUnits(patch, current, { scoped: false })).toBe(patch);
  });

  it("completa las variables con las que la persona no ve", () => {
    const edited = [{ ...current.variables[0], value: "#9" }, current.variables[2]];
    const out = normalizePatchForUnits(variables(edited), current, mine);
    expect(out.variables?.map((item) => item.id)).toEqual(["v-own", "v-other", "v-global"]);
    expect(out.variables?.[0].value).toBe("#9");
  });

  it("rechaza cambiar una variable global sin permiso global, y la permite con él", () => {
    const edited = [current.variables[0], { ...current.variables[2], value: "#0" }];
    expect(() => normalizePatchForUnits(variables(edited), current, mine)).toThrow(VersionError);
    expect(normalizePatchForUnits(variables(edited), current, { ...mine, canEditGlobal: true }).variables).toHaveLength(3);
  });

  it("permite estilos de una página que se crea en el mismo parche en su unidad", () => {
    const created = { id: "pn", unitId: "u1" };
    const patch = { pages: { upsert: [created], remove: [] }, variables: [...seen, { id: "v-new", scope: { kind: "page", pageId: "pn" }, name: "n", kind: "color", value: "#5" }] } as unknown as SitePatch;
    expect(normalizePatchForUnits(patch, current, mine).variables?.map((item) => item.id)).toContain("v-new");
  });

  it("completa las reglas de estilo con las que no ve", () => {
    const patch = { rules: [current.rules[0], current.rules[2]] } as unknown as SitePatch;
    expect(normalizePatchForUnits(patch, current, mine).rules).toHaveLength(3);
  });

  it("completa la biblioteca de medios dentro de los ajustes y conserva sus otras claves", () => {
    const patch = { settings: { otra: 1, projectMedia: [current.projectMedia![0], current.projectMedia![2], { id: "m4", unitId: "u1" }] } } as unknown as SitePatch;
    const out = normalizePatchForUnits(patch, current, mine).settings as { otra: number; projectMedia: { id: string }[] };
    expect(out.otra).toBe(1);
    expect(out.projectMedia.map((item) => item.id)).toEqual(["m1", "m2", "m3", "m4"]);
  });

  it("el orden de las páginas se completa con las invisibles en su sitio", () => {
    const order = { pages: { upsert: [], remove: [], order: ["pg", "pz"] } } as unknown as SitePatch;
    expect(normalizePatchForUnits(order, current, mine).pages?.order).toEqual(["pg", "ps", "pz"]);
  });

  it("una página nueva en el orden queda al final y una quitada desaparece", () => {
    const order = { pages: { upsert: [{ id: "pn", unitId: "u1" }], remove: ["pz"], order: ["pg", "pn"] } } as unknown as SitePatch;
    expect(normalizePatchForUnits(order, current, mine).pages?.order).toEqual(["pg", "ps", "pn"]);
  });

  it("restaura los medios invisibles aunque la persona no envíe ninguno", () => {
    const patch = { settings: { otra: 1 } } as unknown as SitePatch;
    const out = normalizePatchForUnits(patch, { ...current, projectMedia: [current.projectMedia![1]] } as SiteState, mine).settings as { projectMedia: { id: string }[] };
    expect(out.projectMedia.map((item) => item.id)).toEqual(["m2"]);
  });
});
