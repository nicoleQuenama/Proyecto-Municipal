import { describe, expect, it } from "vitest";
import { VersionError } from "../versions/branch-rows";
import { parseIds, parseUnitInput } from "./unit-input";

const OWNER = "01a1c142-794d-707b-a4b7-eb38bffee429";

describe("parseUnitInput", () => {
  it("normaliza una entrada válida", () => {
    expect(parseUnitInput({ name: "  Zoonosis ", kind: "designer", ownerId: OWNER, reviewRequired: true })).toEqual({
      name: "Zoonosis",
      kind: "designer",
      ownerId: OWNER,
      reviewRequired: true,
      overrides: [],
    });
  });

  it("sin dueño ni revisión obligatoria usa los valores por defecto", () => {
    expect(parseUnitInput({ name: "Salud", kind: "dev" })).toMatchObject({ ownerId: null, reviewRequired: false });
  });

  it("rechaza nombres vacíos o demasiado largos", () => {
    expect(() => parseUnitInput({ name: "   ", kind: "dev" })).toThrow(VersionError);
    expect(() => parseUnitInput({ name: "x".repeat(121), kind: "dev" })).toThrow(VersionError);
    expect(() => parseUnitInput({ kind: "dev" })).toThrow(VersionError);
  });

  it("rechaza un tipo que no es diseñador ni desarrollador", () => {
    expect(() => parseUnitInput({ name: "A", kind: "admin" })).toThrow(VersionError);
  });

  it("rechaza un dueño que no es un id y una revisión que no es verdadero o falso", () => {
    expect(() => parseUnitInput({ name: "A", kind: "dev", ownerId: "juan" })).toThrow(VersionError);
    expect(() => parseUnitInput({ name: "A", kind: "dev", reviewRequired: "si" })).toThrow(VersionError);
  });

  it("acepta ajustes de permisos conocidos y rechaza los desconocidos, los repetidos y manageUsers", () => {
    expect(parseUnitInput({ name: "A", kind: "dev", overrides: [{ permission: "deploy", allowed: false }] }).overrides).toEqual([{ permission: "deploy", allowed: false }]);
    expect(() => parseUnitInput({ name: "A", kind: "dev", overrides: [{ permission: "volar", allowed: true }] })).toThrow(VersionError);
    expect(() => parseUnitInput({ name: "A", kind: "dev", overrides: [{ permission: "deploy", allowed: true }, { permission: "deploy", allowed: false }] })).toThrow(VersionError);
    expect(() => parseUnitInput({ name: "A", kind: "dev", overrides: [{ permission: "manageUsers", allowed: true }] })).toThrow(VersionError);
  });

  it("no acepta un cuerpo que no es un objeto", () => {
    expect(() => parseUnitInput(null)).toThrow(VersionError);
    expect(() => parseUnitInput("texto")).toThrow(VersionError);
  });
});

describe("parseIds", () => {
  it("acepta una lista de ids sin repetir", () => {
    expect(parseIds({ userIds: [OWNER, OWNER] })).toEqual([OWNER]);
  });

  it("rechaza lo que no es una lista de ids", () => {
    expect(() => parseIds({ userIds: "x" })).toThrow(VersionError);
    expect(() => parseIds({ userIds: ["no-es-un-id"] })).toThrow(VersionError);
    expect(() => parseIds({})).toThrow(VersionError);
  });
});
