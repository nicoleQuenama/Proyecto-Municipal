import { describe, expect, it } from "vitest";
import { INITIAL_SITE } from "../site/initial-site";
import { EMPTY_HISTORY, isTracked, record, redoStep, undoStep } from "../site/history-rules";
import { siteReducer } from "../site/site-reducer";

const asset = { id: "m1", name: "m", src: "x.png", kind: "image" as const, createdAt: 1 };

describe("unidades en el reducer del sitio", () => {
  it("una página nueva nace en la unidad activa, sin pedir nada", () => {
    let state = siteReducer(INITIAL_SITE, { type: "unit/set-active", unitId: "u1" });
    state = siteReducer(state, { type: "page/create", id: "nueva", name: "Nueva" });
    expect(state.pages.find((page) => page.id === "nueva")?.unitId).toBe("u1");
  });

  it("sin unidad activa la página no lleva unidad", () => {
    const state = siteReducer(INITIAL_SITE, { type: "page/create", id: "nueva", name: "Nueva" });
    expect(state.pages.find((page) => page.id === "nueva")).not.toHaveProperty("unitId");
  });

  it("un archivo nuevo de la biblioteca queda en la unidad activa, salvo que ya traiga una", () => {
    let state = siteReducer(INITIAL_SITE, { type: "unit/set-active", unitId: "u1" });
    state = siteReducer(state, { type: "project-media/add", asset });
    state = siteReducer(state, { type: "project-media/add", asset: { ...asset, id: "m2", unitId: null } });
    expect(state.projectMedia?.find((item) => item.id === "m1")?.unitId).toBe("u1");
    expect(state.projectMedia?.find((item) => item.id === "m2")?.unitId).toBeNull();
  });

  it("page/set-unit y project-media/set-unit cambian la unidad", () => {
    let state = siteReducer(INITIAL_SITE, { type: "project-media/add", asset });
    state = siteReducer(state, { type: "project-media/set-unit", id: "m1", unitId: "u2" });
    state = siteReducer(state, { type: "page/set-unit", pageId: state.pages[0].id, unitId: "u2" });
    expect(state.projectMedia?.[0].unitId).toBe("u2");
    expect(state.pages[0].unitId).toBe("u2");
  });

  it("cambiar de unidad no entra al historial, y deshacer o rehacer no la cambian", () => {
    expect(isTracked({ type: "unit/set-active", unitId: "u1" })).toBe(false);
    const edit = { type: "page/create", id: "n", name: "N" } as const;
    const history = record(EMPTY_HISTORY, { ...INITIAL_SITE, activeUnitId: "u1" }, edit, 0);
    const now = { ...INITIAL_SITE, activeUnitId: "u2" };
    const undone = undoStep(history, now)!;
    expect(undone.state.activeUnitId).toBe("u2");
    expect(redoStep(undone.history, { ...INITIAL_SITE, activeUnitId: "u3" })?.state.activeUnitId).toBe("u3");
  });

  it("la unidad activa es de la pantalla: no se guarda con el sitio", async () => {
    const { SCREEN_KEYS } = await import("../../server/site/site-keys");
    expect(SCREEN_KEYS).toContain("activeUnitId");
  });
});
