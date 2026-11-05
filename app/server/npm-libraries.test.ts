import { describe, expect, it } from "vitest";
import { availability, isValidName, isValidVersion } from "./npm-libraries";

describe("npm libraries rules", () => {
  it("valida nombres de paquetes npm válidos e inválidos", () => {
    expect(isValidName("lodash")).toBe(true);
    expect(isValidName("canvas-confetti")).toBe(true);
    expect(isValidName("@types/node")).toBe(true);
    expect(isValidName("@babel/core")).toBe(true);

    expect(isValidName("")).toBe(false);
    expect(isValidName("lodash; rm -rf /")).toBe(false);
    expect(isValidName("invalid name with spaces")).toBe(false);
    expect(isValidName("!invalid")).toBe(false);
  });

  it("valida versiones de paquetes", () => {
    expect(isValidVersion("1.0.0")).toBe(true);
    expect(isValidVersion("^2.1.0")).toBe(true);
    expect(isValidVersion("~1.2.3")).toBe(true);
    expect(isValidVersion("latest")).toBe(true);

    expect(isValidVersion("1.0.0; rm -rf")).toBe(false);
    expect(isValidVersion("invalid version with spaces")).toBe(false);
  });

  it("está disponible en modo de desarrollo", () => {
    const status = availability();
    expect(status.available).toBe(true);
  });
});
