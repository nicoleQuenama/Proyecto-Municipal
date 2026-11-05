import { describe, expect, it } from "vitest";
import { INITIAL_STATE } from "./initial-state";
import type { Conflict, PullRequest } from "./types";
import { versioningReducer } from "./versioning-reducer";

const pr = (number: number, status: PullRequest["status"] = "open", conflicts: Conflict[] = []): PullRequest => ({
  number, title: "t", from: "a", into: "main", author: "Ana", status, approvals: [], requiredApprovals: 1, changes: [], conflicts, authorId: "u1", reviewerId: null,
});
const conflict = (resolution: Conflict["resolution"] = null): Conflict => ({ node: "pages/a", property: "name", base: "x", into: "y", from: "z", resolution });
const load = (pullRequests: PullRequest[]) => ({ type: "server/load" as const, branches: [{ name: "main", author: "Equipo", base: null }], commits: [], pullRequests, issues: [], labels: [], people: [], releases: [] });

describe("lo que llega del servidor", () => {
  it("el estado de partida está vacío: todo llega del servidor", () => {
    expect(Object.values(INITIAL_STATE).every((value) => Array.isArray(value) && value.length === 0)).toBe(true);
  });

  it("reemplaza ramas, versiones y pull requests", () => {
    const next = versioningReducer(INITIAL_STATE, load([pr(1)]));
    expect(next.branches.map((b) => b.name)).toEqual(["main"]);
    expect(next.pullRequests.map((p) => p.number)).toEqual([1]);
  });

  it("conserva los conflictos ya elegidos mientras la pull request siga abierta", () => {
    const withConflicts = versioningReducer(versioningReducer(INITIAL_STATE, load([pr(1)])), { type: "review/conflicts", number: 1, conflicts: [conflict()] });
    const resolved = versioningReducer(withConflicts, { type: "pr/resolve", number: 1, index: 0, resolution: "from" });
    const refreshed = versioningReducer(resolved, load([pr(1)]));
    expect(refreshed.pullRequests[0].conflicts[0].resolution).toBe("from");
  });

  it("no arrastra conflictos de una pull request que ya se cerró", () => {
    const withConflicts = versioningReducer(versioningReducer(INITIAL_STATE, load([pr(1)])), { type: "review/conflicts", number: 1, conflicts: [conflict()] });
    expect(versioningReducer(withConflicts, load([pr(1, "merged")])).pullRequests[0].conflicts).toEqual([]);
  });
});
