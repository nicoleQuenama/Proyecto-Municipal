import { describe, expect, it } from "vitest";
import { INITIAL_SITE } from "../site/initial-site";
import { setPageRole } from "../site/page-roles";
import { siteReducer } from "../site/site-reducer";
import type { SiteAction, SiteState } from "../site/types";
import { buildDemo } from "./demo-script";

const site = (): SiteState => {
  let state = siteReducer(INITIAL_SITE, { type: "page/create", id: "carga", name: "Carga" });
  state = siteReducer(state, { type: "page/create", id: "nf", name: "No encontrada" });
  state = setPageRole(state, "carga", "loading");
  return setPageRole(state, "nf", "not-found");
};
const play = (state: SiteState, actions: SiteAction[]) => actions.reduce(siteReducer, state);

describe("guion de la demostración", () => {
  it("construye la página de inicio, la de carga y la 404 con acciones del editor", () => {
    const start = site();
    const built = play(start, buildDemo(start).map((step) => step.action));
    const blocks = (id: string) => built.pages.find((p) => p.id === id)!.blocks;

    expect(blocks("inicio").length).toBeGreaterThan(40);
    expect(blocks("carga").length).toBe(2);
    expect(blocks("nf").length).toBe(4);
  });

  it("la página de carga cuenta de 0 a 100 al cargar", () => {
    const start = site();
    const built = play(start, buildDemo(start).map((step) => step.action));
    const behaviors = built.pages.find((p) => p.id === "carga")!.blocks.flatMap((b) => b.behaviors ?? []);
    expect(behaviors).toHaveLength(1);
    expect(behaviors[0]).toMatchObject({ trigger: "load", action: { kind: "count", to: 100 } });
  });

  it("el enlace «Volver al inicio» lleva a la página de inicio", () => {
    const start = site();
    const built = play(start, buildDemo(start).map((step) => step.action));
    const links = built.components.flatMap((c) => Object.values(c.links));
    expect(links).toContainEqual({ kind: "page", pageId: "inicio" });
  });

  it("repetirla no duplica nada", () => {
    const start = site();
    const once = play(start, buildDemo(start).map((s) => s.action));
    const twice = play(once, buildDemo(once).map((s) => s.action));
    const count = (state: SiteState, id: string) => state.pages.find((p) => p.id === id)!.blocks.length;
    for (const id of ["inicio", "carga", "nf"]) expect(count(twice, id)).toBe(count(once, id));
  });

  it("cada acción de dibujo lleva la zona donde actúa el cursor", () => {
    const steps = buildDemo(site());
    const draws = steps.filter((s) => s.action.type === "shape/draw");
    expect(draws.length).toBeGreaterThan(0);
    expect(draws.every((s) => s.target !== undefined)).toBe(true);
  });
});
