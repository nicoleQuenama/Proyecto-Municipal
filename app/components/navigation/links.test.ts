import { describe, expect, it } from "vitest";
import { isCurrentPageLink } from "./links";

describe("isCurrentPageLink", () => {
  const page = { kind: "page" as const, pageId: "tramites" };

  it("marca solo el enlace a la página actual", () => {
    expect(isCurrentPageLink(page, "tramites")).toBe(true);
    expect(isCurrentPageLink(page, "inicio")).toBe(false);
  });

  it("no marca enlaces externos, ventanas ni enlaces sin página", () => {
    expect(isCurrentPageLink({ kind: "external", url: "https://ejemplo.com", newTab: false }, "tramites")).toBe(false);
    expect(isCurrentPageLink({ kind: "modal", pageId: "tramites" }, "tramites")).toBe(false);
    expect(isCurrentPageLink(undefined, "tramites")).toBe(false);
    expect(isCurrentPageLink(page, undefined)).toBe(false);
  });
});
