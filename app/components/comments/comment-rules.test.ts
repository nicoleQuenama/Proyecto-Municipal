import { describe, expect, it } from "vitest";
import { INITIAL_SITE } from "../site/initial-site";
import { siteReducer } from "../site/site-reducer";
import { canRemoveComment, visibleComments, type DesignComment } from "./comment-rules";

const note = (id: string, author: string, audience: DesignComment["audience"], pageId = "inicio"): DesignComment => ({
  id, pageId, x: 10, y: 20, text: "Revisar", author, at: "2026-10-27T10:00:00Z", audience,
});

describe("comentarios", () => {
  it("añadir, resolver y borrar pasan por el reductor", () => {
    let state = siteReducer(INITIAL_SITE, { type: "comment/add", comment: note("a", "Ana", "team") });
    expect(state.comments).toHaveLength(1);
    state = siteReducer(state, { type: "comment/resolve", id: "a", resolved: true });
    expect(state.comments?.[0].resolved).toBe(true);
    state = siteReducer(state, { type: "comment/remove", id: "a" });
    expect(state.comments).toEqual([]);
  });

  it("los privados solo los ve su autor; los del equipo, todos", () => {
    const all = [note("a", "Ana", "team"), note("b", "Ana", "private"), note("c", "Luis", "private"), note("d", "Luis", "team", "otra")];
    expect(visibleComments(all, "inicio", "Ana").map((c) => c.id)).toEqual(["a", "b"]);
    expect(visibleComments(all, "inicio", "Luis").map((c) => c.id)).toEqual(["a", "c"]);
  });

  it("solo el autor borra", () => {
    expect(canRemoveComment(note("a", "Ana", "team"), "Ana")).toBe(true);
    expect(canRemoveComment(note("a", "Ana", "team"), "Luis")).toBe(false);
  });
});
