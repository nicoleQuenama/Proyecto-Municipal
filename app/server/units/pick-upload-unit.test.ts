import { describe, expect, it } from "vitest";
import { VersionError } from "../versions/branch-rows";
import { pickUploadUnit } from "./pick-upload-unit";
import type { UnitAccess } from "./types";

const scoped = (unitIds: string[], canEditGlobal = false): UnitAccess => ({ scoped: true, unitIds, canEditGlobal });

describe("pickUploadUnit", () => {
  it("sin unidades (superadmin u organización sin ellas) respeta lo pedido y por defecto es global", () => {
    expect(pickUploadUnit({ scoped: false }, undefined)).toBeNull();
    expect(pickUploadUnit({ scoped: false }, "u1")).toBe("u1");
    expect(pickUploadUnit({ scoped: false }, null)).toBeNull();
  });

  it("con una sola unidad, el archivo va a ella sin pedir nada", () => {
    expect(pickUploadUnit(scoped(["u1"]), undefined)).toBe("u1");
  });

  it("con varias unidades hay que elegir", () => {
    expect(() => pickUploadUnit(scoped(["u1", "u2"]), undefined)).toThrow(VersionError);
  });

  it("acepta una unidad propia y rechaza una ajena", () => {
    expect(pickUploadUnit(scoped(["u1", "u2"]), "u2")).toBe("u2");
    expect(() => pickUploadUnit(scoped(["u1"]), "u9")).toThrow(VersionError);
  });

  it("subir como global exige permiso global", () => {
    expect(() => pickUploadUnit(scoped(["u1"]), null)).toThrow(VersionError);
    expect(pickUploadUnit(scoped(["u1"], true), null)).toBeNull();
  });

  it("sin unidades pero con permiso global, el archivo por defecto es global", () => {
    expect(pickUploadUnit(scoped([], true), undefined)).toBeNull();
    expect(() => pickUploadUnit(scoped([], false), undefined)).toThrow(VersionError);
  });
});
