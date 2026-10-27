import { describe, expect, it } from "vitest";
import type { SiteAction } from "../site/types";
import { guardAction } from "./guard-actions";
import type { User } from "./types";

const pages = [
  { id: "inicio", blocks: [{ id: "b1", componentId: "tarjeta" }, { id: "b2", componentId: "hero" }] },
  { id: "lista", blocks: [{ id: "b3", componentId: "tarjeta" }, { id: "b4", componentId: "tarjeta" }] },
];

const user = (scope: { pageIds: string[]; blockIds: string[] } | null): User => ({
  id: "u", username: "u", name: "U", email: "u@t.dev", role: "dev", access: { scope, denied: [] },
});

const style = (componentId: string): SiteAction => ({
  type: "component/element", componentId, pageId: "inicio", blockId: "b1", elementId: "e1", patch: { fill: "#fff" },
});

describe("guardAction", () => {
  it("sin límite todo sigue igual", () => {
    expect(guardAction(style("tarjeta"), user(null), pages)).toEqual({ kind: "run", actions: [style("tarjeta")] });
  });

  it("rechaza lo que toca una sección ajena", () => {
    const action: SiteAction = { type: "block/style", pageId: "inicio", blockId: "b2", elementIds: ["e1"], patch: {} };
    expect(guardAction(action, user({ pageIds: [], blockIds: ["b1"] }), pages).kind).toBe("blocked");
  });

  it("permite lo de su propia sección", () => {
    const action: SiteAction = { type: "block/style", pageId: "inicio", blockId: "b1", elementIds: ["e1"], patch: {} };
    expect(guardAction(action, user({ pageIds: [], blockIds: ["b1"] }), pages).kind).toBe("run");
  });

  it("«todo el componente» se reparte solo entre sus secciones", () => {
    const result = guardAction(style("tarjeta"), user({ pageIds: [], blockIds: ["b1", "b3"] }), pages);
    expect(result.kind).toBe("narrowed");
    if (result.kind !== "narrowed") return;
    expect(result.count).toBe(2);
    expect(result.actions).toEqual([
      { type: "block/style", pageId: "inicio", blockId: "b1", elementIds: ["e1"], patch: { fill: "#fff" } },
      { type: "block/style", pageId: "lista", blockId: "b3", elementIds: ["e1"], patch: { fill: "#fff" } },
    ]);
  });

  it("si todas las secciones del componente son suyas, el cambio vale tal cual", () => {
    const result = guardAction(style("tarjeta"), user({ pageIds: ["lista"], blockIds: ["b1"] }), pages);
    expect(result).toEqual({ kind: "run", actions: [style("tarjeta")] });
  });

  it("un componente sin ninguna sección suya se rechaza", () => {
    expect(guardAction(style("hero"), user({ pageIds: ["lista"], blockIds: [] }), pages).kind).toBe("blocked");
  });

  it("recolorear todo el componente se reparte como recolorear cada sección", () => {
    const action: SiteAction = { type: "component/recolor", componentId: "tarjeta", pageId: "inicio", blockId: "b1", color: "#123456", fill: ["e1"], text: [], box: true };
    const result = guardAction(action, user({ pageIds: [], blockIds: ["b4"] }), pages);
    expect(result.kind === "narrowed" && result.actions).toEqual([
      { type: "block/recolor", pageId: "lista", blockId: "b4", color: "#123456", fill: ["e1"], text: [], box: true },
    ]);
  });

  it("quitar elementos de todo el componente se reparte como quitarlos de cada sección", () => {
    const action: SiteAction = { type: "element/remove", scope: "component", pageId: "inicio", blockId: "b1", elementIds: ["e1"] };
    const result = guardAction(action, user({ pageIds: [], blockIds: ["b1"] }), pages);
    expect(result.kind === "narrowed" && result.actions).toEqual([{ type: "element/remove", scope: "block", pageId: "inicio", blockId: "b1", elementIds: ["e1"] }]);
  });

  it("un componente nuevo que nadie usa no molesta a nadie", () => {
    const action: SiteAction = { type: "component/delete", id: "nuevo" };
    expect(guardAction(action, user({ pageIds: [], blockIds: [] }), pages).kind).toBe("run");
  });
});
