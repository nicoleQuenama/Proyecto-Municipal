import { describe, expect, it } from "vitest";
import { pickReviewer } from "./reviewer";

const owners = new Map<string, string | null>([["u1", "o1"], ["u2", "o2"], ["u3", null]]);
const pick = (authorId: string, units: (string | null)[]) => pickReviewer({ authorId, changedPageUnitIds: units, owners });

describe("pickReviewer", () => {
  it("lo que toca una sola unidad va al dueño de esa unidad", () => {
    expect(pick("a", ["u1", "u1"])).toBe("o1");
  });

  it("si toca varias unidades va al superadmin (null)", () => {
    expect(pick("a", ["u1", "u2"])).toBeNull();
  });

  it("si el autor es el dueño va al superadmin, porque nadie se revisa a sí mismo", () => {
    expect(pick("o1", ["u1"])).toBeNull();
  });

  it("una unidad sin dueño, o una desconocida, va al superadmin", () => {
    expect(pick("a", ["u3"])).toBeNull();
    expect(pick("a", ["desconocida"])).toBeNull();
  });

  it("lo global, o mezclar global con una unidad, va al superadmin", () => {
    expect(pick("a", [null])).toBeNull();
    expect(pick("a", ["u1", null])).toBeNull();
  });

  it("sin páginas cambiadas (solo ajustes) va al superadmin", () => {
    expect(pick("a", [])).toBeNull();
  });
});
