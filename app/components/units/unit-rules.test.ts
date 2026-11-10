import { describe, expect, it } from "vitest";
import type { User } from "../auth/types";
import type { Page } from "../site/types";
import { pickActiveUnit } from "./active-unit";
import { isPageReadOnly, ownPageIds } from "./own-pages";

const pages = [{ id: "pz", unitId: "u1" }, { id: "ps", unitId: "u2" }, { id: "pg" }] as unknown as Page[];
const unitUser = (units: string[], canEditGlobal = false): Pick<User, "units" | "canEditGlobal"> => ({ units: units.map((id) => ({ id, name: id })), canEditGlobal });

describe("ownPageIds / isPageReadOnly", () => {
  it("las páginas de sus unidades son suyas; las globales solo con permiso global", () => {
    expect(ownPageIds(pages, unitUser(["u1"]))).toEqual(["pz"]);
    expect(ownPageIds(pages, unitUser(["u1", "u2"]))).toEqual(["pz", "ps"]);
    expect(ownPageIds(pages, unitUser(["u1"], true))).toEqual(["pz", "pg"]);
  });

  it("una página global es de solo lectura para quien no puede editar lo global", () => {
    expect(isPageReadOnly(unitUser(["u1"]), pages[2])).toBe(true);
    expect(isPageReadOnly(unitUser(["u1"], true), pages[2])).toBe(false);
    expect(isPageReadOnly(unitUser(["u1"]), pages[0])).toBe(false);
  });

  it("quien no está sujeto a unidades nunca ve nada de solo lectura por esto", () => {
    expect(isPageReadOnly({}, pages[2])).toBe(false);
    expect(isPageReadOnly(null, pages[2])).toBe(false);
  });
});

describe("pickActiveUnit", () => {
  it("sin unidades no hay unidad activa", () => {
    expect(pickActiveUnit({}, "u1")).toBeUndefined();
    expect(pickActiveUnit(null, null)).toBeUndefined();
  });

  it("recuerda la última elegida si sigue siendo suya", () => {
    expect(pickActiveUnit(unitUser(["u1", "u2"]), "u2")).toBe("u2");
  });

  it("si la recordada ya no es suya, o no hay, usa la primera", () => {
    expect(pickActiveUnit(unitUser(["u1", "u2"]), "u9")).toBe("u1");
    expect(pickActiveUnit(unitUser(["u1", "u2"]), null)).toBe("u1");
  });

  it("«global» solo con permiso global", () => {
    expect(pickActiveUnit(unitUser(["u1"], true), "global")).toBeNull();
    expect(pickActiveUnit(unitUser(["u1"]), "global")).toBe("u1");
  });

  it("con permiso global y sin unidades, trabaja en lo global", () => {
    expect(pickActiveUnit(unitUser([], true), null)).toBeNull();
    expect(pickActiveUnit(unitUser([]), null)).toBeUndefined();
  });
});
