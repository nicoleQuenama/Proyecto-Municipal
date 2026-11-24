import { describe, expect, it } from "vitest";
import { boxStyle, pixelsOf, styleElement } from "./apply";
import type { CanvasElement } from "../site/types";

describe("apply / pixelsOf", () => {
  it("converts string px values to numbers", () => {
    expect(pixelsOf("12px", 0)).toBe(12);
    expect(pixelsOf("10", 0)).toBe(10);
  });

  it("handles numbers directly without crashing", () => {
    expect(pixelsOf(12 as any, 0)).toBe(12);
    expect(pixelsOf(0 as any, 10)).toBe(0);
  });

  it("falls back when value is invalid or undefined", () => {
    expect(pixelsOf(undefined, 8)).toBe(8);
    expect(pixelsOf("invalid", 8)).toBe(8);
  });
});

describe("apply / boxStyle", () => {
  it("generates border css when borderWidth is a number", () => {
    const css = boxStyle({
      borderWidth: 1 as any,
      borderColor: "#00A7D6",
      borderStyle: "solid",
    });
    expect(css.borderWidth).toBe("1px");
    expect(css.borderColor).toBe("#00A7D6");
    expect(css.borderStyle).toBe("solid");
  });

  it("generates border css when borderWidth is a string with px", () => {
    const css = boxStyle({
      borderWidth: "2px",
      borderColor: "#E2E8F0",
      borderStyle: "dashed",
    });
    expect(css.borderWidth).toBe("2px");
    expect(css.borderColor).toBe("#E2E8F0");
    expect(css.borderStyle).toBe("dashed");
  });

  it("handles zero border width without applying borders", () => {
    const css = boxStyle({
      borderWidth: 0 as any,
    });
    expect(css.borderWidth).toBeUndefined();
    expect(css.borderStyle).toBeUndefined();
  });

  it("handles numeric radius values cleanly", () => {
    const css = boxStyle({
      radius: 12 as any,
    });
    expect(css.borderRadius).toBe("12px");
  });
});

describe("apply / styleElement", () => {
  it("applies border properties to canvas elements", () => {
    const element: CanvasElement = {
      id: "test-el",
      role: "container",
      kind: "rect",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };

    const styled = styleElement(element, {
      borderWidth: 2 as any,
      borderColor: "#00A7D6",
      borderStyle: "solid",
      radius: 12 as any,
    });

    expect(styled.borderWidth).toBe(2);
    expect(styled.borderColor).toBe("#00A7D6");
    expect(styled.borderStyle).toBe("solid");
    expect(styled.radius).toBe(12);
  });
});
