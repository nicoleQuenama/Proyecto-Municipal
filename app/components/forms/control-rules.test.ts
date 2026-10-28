import { describe, expect, it } from "vitest";
import { INITIAL_SITE } from "../site/initial-site";
import { siteReducer } from "../site/site-reducer";
import type { CanvasElement, SiteState } from "../site/types";

const element = { id: "e", kind: "rect" } as CanvasElement;
const site = (): SiteState => ({
  ...INITIAL_SITE,
  components: [{ id: "c", name: "C", description: "", category: "sections", width: 100, height: 40, elements: [element], links: {}, custom: true }],
});
const apply = siteReducer;
const get = (state: SiteState) => state.components[0].elements[0].control;

describe("rol del elemento", () => {
  it("asignar un rol le da sus datos de partida", () => {
    const next = apply(site(), { type: "component/control", componentId: "c", elementId: "e", control: { kind: "input" } });
    expect(get(next)).toMatchObject({ kind: "input", name: "campo", inputType: "text" });
  });

  it("cambiar un dato conserva el rol", () => {
    let state = apply(site(), { type: "component/control", componentId: "c", elementId: "e", control: { kind: "input" } });
    state = apply(state, { type: "component/control", componentId: "c", elementId: "e", control: { name: "correo", required: true } });
    expect(get(state)).toMatchObject({ kind: "input", name: "correo", required: true });
  });

  it("cambiar de rol reinicia los datos y quitarlo lo borra", () => {
    let state = apply(site(), { type: "component/control", componentId: "c", elementId: "e", control: { kind: "input" } });
    state = apply(state, { type: "component/control", componentId: "c", elementId: "e", control: { kind: "select" } });
    expect(get(state)?.options).toHaveLength(2);
    state = apply(state, { type: "component/control", componentId: "c", elementId: "e", control: null });
    expect(get(state)).toBeUndefined();
  });
});
