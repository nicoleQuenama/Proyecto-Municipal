import { describe, expect, it } from "vitest";
import { marginSides } from "./margin-sides";

describe("marginSides", () => {
  it("abre uno, dos, tres y cuatro valores", () => {
    expect(marginSides("8px")).toEqual({ marginTop: "8px", marginRight: "8px", marginBottom: "8px", marginLeft: "8px" });
    expect(marginSides("8px 0")).toEqual({ marginTop: "8px", marginRight: "0", marginBottom: "8px", marginLeft: "0" });
    expect(marginSides("1px 2px 3px")).toEqual({ marginTop: "1px", marginRight: "2px", marginBottom: "3px", marginLeft: "2px" });
    expect(marginSides("1px 2px 3px 4px")).toEqual({ marginTop: "1px", marginRight: "2px", marginBottom: "3px", marginLeft: "4px" });
  });

  it("no parte un calc() ni se rompe sin valor", () => {
    expect(marginSides("calc(1px + 2px) 0").marginTop).toBe("calc(1px + 2px)");
    expect(marginSides(undefined)).toEqual({ marginTop: undefined, marginRight: undefined, marginBottom: undefined, marginLeft: undefined });
  });
});
