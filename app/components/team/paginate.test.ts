import { describe, expect, it } from "vitest";
import { paginate } from "./paginate";

const list = Array.from({ length: 23 }, (_, i) => i + 1);

describe("paginate", () => {
  it("devuelve el primer trozo y sus límites", () => {
    const p = paginate(list, 1, 10);
    expect([p.items.length, p.pages, p.from, p.to, p.total]).toEqual([10, 3, 1, 10, 23]);
  });
  it("la última página trae el resto", () => expect(paginate(list, 3, 10).items).toEqual([21, 22, 23]));
  it("ajusta una página fuera de rango", () => expect(paginate(list, 9, 10).page).toBe(3));
  it("una lista vacía tiene una página y ningún elemento", () => {
    const p = paginate([], 1, 10);
    expect([p.pages, p.from, p.to]).toEqual([1, 0, 0]);
  });
});
