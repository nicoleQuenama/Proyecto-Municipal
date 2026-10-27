import { describe, expect, it } from "vitest";
import { COALESCE_MS, EMPTY_HISTORY, HISTORY_LIMIT, record, redoStep, undoStep } from "./history-rules";
import { INITIAL_SITE } from "./initial-site";
import type { SiteAction, SiteState } from "./types";

const at = (name: string): SiteState => ({ ...INITIAL_SITE, globalCss: name });
const rename: SiteAction = { type: "page/rename", id: "inicio", name: "X" };
const css: SiteAction = { type: "global-css/set", css: "a" };

describe("historial", () => {
  it("cada cambio guarda cómo estaba el sitio, y deshacer y rehacer van y vuelven", () => {
    let history = record(EMPTY_HISTORY, at("a"), rename, 0);
    history = record(history, at("b"), css, 5000);
    const back = undoStep(history, at("c"))!;
    expect(back.state.globalCss).toBe("b");
    const again = undoStep(back.history, back.state)!;
    expect(again.state.globalCss).toBe("a");
    const forward = redoStep(again.history, again.state)!;
    expect(forward.state.globalCss).toBe("b");
  });

  it("un cambio nuevo borra lo que se había deshecho", () => {
    const history = record(EMPTY_HISTORY, at("a"), rename, 0);
    const back = undoStep(history, at("b"))!;
    expect(back.history.future).toHaveLength(1);
    expect(record(back.history, at("a"), css, 9000).future).toHaveLength(0);
  });

  it("seleccionar o cargar no se anotan", () => {
    const select: SiteAction = { type: "block/select", id: "x" };
    expect(record(EMPTY_HISTORY, at("a"), select, 0)).toBe(EMPTY_HISTORY);
    expect(record(EMPTY_HISTORY, at("a"), { type: "project/load", state: INITIAL_SITE }, 0)).toBe(EMPTY_HISTORY);
  });

  it("los cambios seguidos del mismo gesto son un solo paso", () => {
    let history = record(EMPTY_HISTORY, at("a"), css, 0);
    history = record(history, at("b"), css, 100);
    history = record(history, at("c"), css, 100 + COALESCE_MS - 1);
    expect(history.past).toHaveLength(1);
    expect(undoStep(history, at("d"))!.state.globalCss).toBe("a");
    expect(record(history, at("d"), css, 100 + COALESCE_MS + 5000).past).toHaveLength(2);
  });

  it("solo recuerda los últimos pasos", () => {
    let history = EMPTY_HISTORY;
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) history = record(history, at(String(i)), i % 2 ? rename : css, i * 10_000);
    expect(history.past).toHaveLength(HISTORY_LIMIT);
  });

  it("sin pasos no hay nada que deshacer ni rehacer", () => {
    expect(undoStep(EMPTY_HISTORY, at("a"))).toBeNull();
    expect(redoStep(EMPTY_HISTORY, at("a"))).toBeNull();
  });
});
