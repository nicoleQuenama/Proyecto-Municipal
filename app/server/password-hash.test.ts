import { describe, expect, it } from "vitest";
import { hashPassword, NO_ACCOUNT_HASH, passwordMatches } from "./password-hash";

describe("password-hash", () => {
  it("acepta la contraseña correcta y rechaza las demás", async () => {
    const hash = await hashPassword("Clave2026!");
    expect(await passwordMatches("Clave2026!", hash)).toBe(true);
    expect(await passwordMatches("clave2026!", hash)).toBe(false);
  });

  it("no repite el hash de una misma contraseña (cada uno lleva su sal)", async () => {
    expect(await hashPassword("Clave2026!")).not.toBe(await hashPassword("Clave2026!"));
  });

  it("rechaza lo que no tiene el formato esperado y nunca coincide con la cuenta inexistente", async () => {
    expect(await passwordMatches("x", "texto-plano")).toBe(false);
    expect(await passwordMatches("", NO_ACCOUNT_HASH)).toBe(false);
  });
});
