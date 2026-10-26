import { describe, expect, it } from "vitest";
import type { CanvasElement } from "../site/types";
import { autoMap } from "./auto-map";

const el = (id: string, kind: CanvasElement["kind"], y: number, text = "x"): CanvasElement =>
  ({ id, kind, role: "none", x: 0, y, width: 10, height: 10, fill: "", radius: 0, text, fontSize: 12, color: "", bold: false, align: "left", fontFamily: "", src: "" });

describe("autoMap", () => {
  const item = { number: "#0025", name: "Pikachu", image: "https://x.com/25.png", color: "hsl(10 80% 50%)" };

  it("reparte textos en orden y la imagen a la imagen", () => {
    const refs = autoMap([el("n", "text", 1), el("t", "text", 2), el("i", "image", 0)], item, "items[0]", "s", new Set());
    expect(refs.n.path).toBe("items[0].number");
    expect(refs.t.path).toBe("items[0].name");
    expect(refs.i.path).toBe("items[0].image");
  });

  it("no pone un color como texto", () => {
    const refs = autoMap([el("a", "text", 1), el("b", "text", 2), el("c", "text", 3)], item, "items[0]", "s", new Set());
    expect(Object.values(refs).map((r) => r.path)).not.toContain("items[0].color");
    expect(Object.keys(refs)).toHaveLength(2);
  });
});
