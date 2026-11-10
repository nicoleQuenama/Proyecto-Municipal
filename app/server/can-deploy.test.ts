import { describe, expect, it } from "vitest";
import type { User } from "../components/auth/types";
import { canConfigureServers, canDeploy } from "./can-deploy";

const user = (extra: Partial<User>): User => ({ id: "u", username: "u", name: "U", email: "u@x.com", role: "designer", ...extra });

describe("canDeploy", () => {
  it("sin unidades sigue la regla de siempre: superadmin o desarrollador sin veto", () => {
    expect(canDeploy(user({ role: "superadmin" }))).toBe(true);
    expect(canDeploy(user({ role: "dev" }))).toBe(true);
    expect(canDeploy(user({ role: "designer" }))).toBe(false);
    expect(canDeploy(user({ role: "dev", access: { scope: null, denied: ["deploy"], expiresAt: null } }))).toBe(false);
    expect(canDeploy(null)).toBe(false);
  });

  it("con unidades manda lo que la base de datos calculó: un diseñador de una unidad puede desplegar", () => {
    expect(canDeploy(user({ role: "designer", canDeploy: true }))).toBe(true);
    expect(canDeploy(user({ role: "dev", canDeploy: false }))).toBe(false);
  });
});

describe("canConfigureServers", () => {
  it("sin unidades es lo mismo que desplegar", () => {
    expect(canConfigureServers(user({ role: "dev" }))).toBe(true);
    expect(canConfigureServers(user({ role: "designer" }))).toBe(false);
  });

  it("con unidades exige además el permiso de lo global", () => {
    expect(canConfigureServers(user({ units: [{ id: "a", name: "A" }], canDeploy: true, canEditGlobal: false }))).toBe(false);
    expect(canConfigureServers(user({ units: [{ id: "a", name: "A" }], canDeploy: true, canEditGlobal: true }))).toBe(true);
    expect(canConfigureServers(user({ units: [{ id: "a", name: "A" }], canDeploy: false, canEditGlobal: true }))).toBe(false);
  });
});
