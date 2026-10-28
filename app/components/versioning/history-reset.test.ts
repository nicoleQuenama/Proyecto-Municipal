import { describe, expect, it } from "vitest";
import { INITIAL_STATE } from "./initial-state";
import { versioningReducer } from "./versioning-reducer";

describe("empezar un historial nuevo", () => {
  it("borra versiones y publicaciones y toma el diseño de ahora como punto de partida", () => {
    const old = {
      ...INITIAL_STATE,
      commits: [{ id: "c1", branch: "main", message: "Viejo", author: "Tú", at: "2026-01-01T00:00:00Z", changes: [] }],
      releases: [{ id: "r1", commitId: "c1", branch: "main", message: "Viejo", author: "Tú", at: "2026-01-01T00:00:00Z" }],
      staged: ["a"],
      baseline: { a: { node: "n", property: "p", value: "viejo" } },
    };
    const design = { b: { node: "n", property: "p", value: "nuevo" } };
    const next = versioningReducer(old, { type: "history/reset", baseline: design });
    expect(next.commits).toEqual([]);
    expect(next.releases).toEqual([]);
    expect(next.staged).toEqual([]);
    expect(next.baseline).toEqual(design);
    expect(next.members).toEqual(old.members);
  });
});
