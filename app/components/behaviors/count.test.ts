import { describe, expect, it } from "vitest";
import { countText } from "./count";

describe("countText", () => {
  it("va del inicio al final con el sufijo", () => {
    expect(countText(0, 100, 0, "%")).toBe("0%");
    expect(countText(0, 100, 0.5, "%")).toBe("50%");
    expect(countText(0, 100, 1, "%")).toBe("100%");
  });

  it("no se pasa del final ni baja del inicio", () => {
    expect(countText(0, 100, 2, "")).toBe("100");
    expect(countText(10, 20, -1, "")).toBe("10");
  });

  it("también cuenta hacia atrás", () => {
    expect(countText(10, 0, 0.5, "")).toBe("5");
  });
});
