import { describe, expect, it } from "vitest";
import { INITIAL_STATE } from "./initial-state";
import { CURRENT_USER, type PullRequest } from "./types";
import { versioningReducer } from "./versioning-reducer";
import { approversOf, inviteLink, inviteToken, memberProblem } from "./versioning-rules";

const add = (state = INITIAL_STATE, name = "ana@mail.com", role: "Editor" | "Revisor" = "Editor") =>
  versioningReducer(state, { type: "member/add", name, role });

describe("estado inicial", () => {
  it("está limpio", () => {
    expect(INITIAL_STATE.branches.map((b) => b.name)).toEqual(["main"]);
    expect(INITIAL_STATE.commits).toEqual([]);
    expect(INITIAL_STATE.pullRequests).toEqual([]);
    expect(INITIAL_STATE.issues).toEqual([]);
    expect(INITIAL_STATE.releases).toEqual([]);
    expect(INITIAL_STATE.members).toEqual([{ name: CURRENT_USER, role: "Editor" }]);
    expect(INITIAL_STATE.labels.length).toBeGreaterThan(0);
  });
});

describe("miembros", () => {
  it("añade con su rol y recorta el nombre", () => {
    const state = add(INITIAL_STATE, "  Ana  ", "Revisor");
    expect(state.members.at(-1)).toEqual({ name: "Ana", role: "Revisor" });
  });

  it("ignora vacíos y repetidos sin distinguir mayúsculas", () => {
    expect(add(INITIAL_STATE, "   ")).toBe(INITIAL_STATE);
    const once = add(INITIAL_STATE, "Ana");
    expect(add(once, "ANA")).toBe(once);
    expect(memberProblem(once.members, "ana")).not.toBeNull();
    expect(memberProblem(once.members, "Luis")).toBeNull();
  });

  it("quita a otros pero no a la persona actual", () => {
    const state = add(INITIAL_STATE, "Ana");
    expect(versioningReducer(state, { type: "member/remove", name: "Ana" }).members).toHaveLength(1);
    expect(versioningReducer(state, { type: "member/remove", name: CURRENT_USER })).toBe(state);
  });

  it("al quitar a alguien se le desasigna de los issues", () => {
    let state = add(INITIAL_STATE, "Ana");
    const label = state.labels[0];
    state = versioningReducer(state, { type: "issue/create", title: "t", label, assignees: ["Ana", CURRENT_USER] });
    state = versioningReducer(state, { type: "member/remove", name: "Ana" });
    expect(state.issues[0].assignees).toEqual([CURRENT_USER]);
  });
});

describe("aprobar", () => {
  const pr = (author: string, approvals: string[] = []): PullRequest => ({
    number: 1, title: "t", from: "a", into: "main", author, status: "open",
    approvals, requiredApprovals: 1, changes: [], conflicts: [],
  });

  it("solo ofrece miembros que no son el autor ni aprobaron ya", () => {
    const members = add(add(INITIAL_STATE, "Ana"), "Luis").members;
    expect(approversOf(pr(CURRENT_USER, ["Ana"]), members)).toEqual(["Luis"]);
  });

  it("registra la aprobación de quien se elija", () => {
    const state = add(INITIAL_STATE, "Ana");
    const withPr = { ...state, pullRequests: [pr(CURRENT_USER)] };
    const next = versioningReducer(withPr, { type: "pr/approve", number: 1, by: "Ana" });
    expect(next.pullRequests[0].approvals).toEqual(["Ana"]);
  });
});

describe("enlace de invitación", () => {
  it("es determinista y usa el origen", () => {
    expect(inviteToken("x")).toBe(inviteToken("x"));
    expect(inviteToken("x")).not.toBe(inviteToken("y"));
    expect(inviteLink("http://h", "abc")).toBe("http://h/?invitacion=abc");
  });
});
