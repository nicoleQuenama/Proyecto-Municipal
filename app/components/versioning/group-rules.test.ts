import { describe, expect, it } from "vitest";
import type { User } from "../auth/types";
import { canReview, canSee, defaultBranchOf, isGroupMember, mustUseBranch, pendingFor } from "./group-rules";
import type { PullRequest } from "./types";

const pr = (extra: Partial<PullRequest>): PullRequest => ({
  number: 101, title: "t", from: "trabajo-ana", into: "main", author: "Ana", status: "open",
  approvals: [], requiredApprovals: 1, changes: [], conflicts: [], authorId: "ana", reviewerId: "jefe", ...extra,
});
const jefe = { id: "jefe", role: "dev" as const };
const admin = { id: "root", role: "superadmin" as const };

describe("mustUseBranch", () => {
  const member = { role: "designer", invitedBy: "jefe", access: { scope: null, denied: ["publishMain" as const] } } satisfies Pick<User, "role" | "invitedBy" | "access">;

  it("un miembro del equipo con el veto debe usar rama", () => {
    expect(isGroupMember(member)).toBe(true);
    expect(mustUseBranch(member)).toBe(true);
  });

  it("sin el veto, o sin ser del equipo, puede publicar en main", () => {
    expect(mustUseBranch({ ...member, access: { scope: null, denied: [] } })).toBe(false);
    expect(mustUseBranch({ role: "dev" })).toBe(false);
    expect(mustUseBranch({ role: "superadmin", access: { scope: null, denied: ["publishMain"] } })).toBe(false);
  });
});

describe("quién recibe la pull request", () => {
  it("solo su dueño la revisa", () => {
    expect(canReview(jefe, pr({}))).toBe(true);
    expect(canReview({ id: "otro", role: "dev" }, pr({}))).toBe(false);
  });

  it("otro superadministrador tampoco la recibe si tiene dueño", () => {
    expect(canReview(admin, pr({}))).toBe(false);
  });

  it("sin dueño la recibe un superadministrador", () => {
    expect(canReview(admin, pr({ reviewerId: null }))).toBe(true);
    expect(canReview(jefe, pr({ reviewerId: null }))).toBe(false);
  });

  it("el autor no revisa lo suyo", () => {
    expect(canReview({ id: "ana", role: "dev" }, pr({ reviewerId: "ana" }))).toBe(false);
  });

  it("las ve el autor y el dueño, pero no un tercero", () => {
    expect(canSee({ id: "ana", role: "designer" }, pr({}))).toBe(true);
    expect(canSee(jefe, pr({}))).toBe(true);
    expect(canSee({ id: "otro", role: "dev" }, pr({}))).toBe(false);
  });

  it("las anteriores al sistema se ven siempre", () => {
    expect(canSee({ id: "otro", role: "dev" }, pr({ authorId: undefined }))).toBe(true);
  });

  it("pendingFor cuenta solo las abiertas que le tocan", () => {
    const list = [pr({}), pr({ number: 102, status: "merged" }), pr({ number: 103, reviewerId: "x" })];
    expect(pendingFor(jefe, list).map((p) => p.number)).toEqual([101]);
  });
});

describe("defaultBranchOf", () => {
  it("usa el usuario en un nombre de rama válido", () => {
    expect(defaultBranchOf("Marta T")).toBe("trabajo-marta-t");
  });
});
