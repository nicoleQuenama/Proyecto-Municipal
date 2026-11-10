import { describe, expect, it } from "vitest";
import type { SiteState } from "../../components/site/types";
import type { Tx } from "../db";
import type { SitePatch } from "../site/site-patch";
import { VersionError } from "../versions/branch-rows";
import type { UnitAccess } from "./types";
import { assertGlobalAllowed, assertUnitPages } from "./unit-patch-permissions";

const scope = { org: "o", project: "p" };
const mine: UnitAccess = { scoped: true, unitIds: ["u1"], canEditGlobal: false };

/** Una transacción falsa: `app.can_edit_in_unit` responde que sí solo para las unidades indicadas (`null` = global). */
const tx = (editable: (string | null)[]) => ({ unsafe: async (_sql: string, params: unknown[]) => [{ ok: editable.includes(params[1] as string | null) }] }) as unknown as Tx;

const page = (id: string, unitId?: string, extra: object = {}) => ({ id, unitId, blocks: [], ...extra });
const site = (pages: object[], settings: object = {}) => ({ pages, ...settings }) as unknown as SiteState;
const patch = (value: object) => value as unknown as SitePatch;
const current = site([page("pz", "u1"), page("ps", "u2"), page("pg")]);

describe("assertGlobalAllowed", () => {
  it("no limita a quien no está sujeto a unidades ni a quien tiene permiso global", () => {
    expect(() => assertGlobalAllowed(patch({ components: { upsert: [], remove: [] } }), current, { scoped: false })).not.toThrow();
    expect(() => assertGlobalAllowed(patch({ globalCss: "a{}" }), current, { ...mine, canEditGlobal: true })).not.toThrow();
  });

  it("rechaza tocar lo global sin permiso", () => {
    for (const global of [{ components: { upsert: [], remove: [] } }, { functions: { upsert: [], remove: [] } }, { sources: { upsert: [], remove: [] } }, { libraries: { upsert: [], remove: [] } }, { navigation: {} }, { globalCss: "" }]) {
      expect(() => assertGlobalAllowed(patch(global), current, mine)).toThrow(VersionError);
    }
  });

  it("deja cambiar solo la biblioteca de medios dentro de los ajustes", () => {
    const base = site([], { otra: 1 });
    expect(() => assertGlobalAllowed(patch({ settings: { otra: 1, projectMedia: [{ id: "m" }] } }), base, mine)).not.toThrow();
    expect(() => assertGlobalAllowed(patch({ settings: { otra: 2 } }), base, mine)).toThrow(VersionError);
  });
});

describe("assertUnitPages", () => {
  it("permite editar una página de su unidad y rechaza la de otra o la global", async () => {
    const allowed = tx(["u1"]);
    await expect(assertUnitPages(allowed, scope, patch({ pages: { upsert: [page("pz", "u1", { name: "x" })], remove: [] } }), current)).resolves.toBeUndefined();
    await expect(assertUnitPages(allowed, scope, patch({ pages: { upsert: [page("ps", "u2", { name: "x" })], remove: [] } }), current)).rejects.toThrow(VersionError);
    await expect(assertUnitPages(allowed, scope, patch({ pages: { upsert: [page("pg", undefined, { name: "x" })], remove: [] } }), current)).rejects.toThrow(VersionError);
  });

  it("mover una página propia a otra unidad solo exige poder editar la de origen", async () => {
    await expect(assertUnitPages(tx(["u1"]), scope, patch({ pages: { upsert: [page("pz", "u2")], remove: [] } }), current)).resolves.toBeUndefined();
  });

  it("no deja mover una página ajena", async () => {
    await expect(assertUnitPages(tx(["u1"]), scope, patch({ pages: { upsert: [page("ps", "u1")], remove: [] } }), current)).rejects.toThrow(VersionError);
  });

  it("crear una página exige poder editar la unidad en la que nace", async () => {
    await expect(assertUnitPages(tx(["u1"]), scope, patch({ pages: { upsert: [page("pn", "u1")], remove: [] } }), current)).resolves.toBeUndefined();
    await expect(assertUnitPages(tx(["u1"]), scope, patch({ pages: { upsert: [page("pn", "u2")], remove: [] } }), current)).rejects.toThrow(VersionError);
    await expect(assertUnitPages(tx(["u1"]), scope, patch({ pages: { upsert: [page("pn")], remove: [] } }), current)).rejects.toThrow(VersionError);
  });

  it("quitar una página exige poder editar su unidad", async () => {
    await expect(assertUnitPages(tx(["u1"]), scope, patch({ pages: { upsert: [], remove: ["pz"] } }), current)).resolves.toBeUndefined();
    await expect(assertUnitPages(tx(["u1"]), scope, patch({ pages: { upsert: [], remove: ["ps"] } }), current)).rejects.toThrow(VersionError);
  });

  it("una sección de ámbito global en una página propia exige permiso global", async () => {
    const withGlobal = page("pz", "u1", { blocks: [{ id: "b1", scope: "global" }] });
    await expect(assertUnitPages(tx(["u1"]), scope, patch({ pages: { upsert: [withGlobal], remove: [] } }), current)).rejects.toThrow(VersionError);
    await expect(assertUnitPages(tx(["u1", null]), scope, patch({ pages: { upsert: [withGlobal], remove: [] } }), current)).resolves.toBeUndefined();
  });
});
