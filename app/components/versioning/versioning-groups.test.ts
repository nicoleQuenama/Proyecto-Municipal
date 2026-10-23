import { describe, expect, it } from "vitest";
import { groupChanges, groupNameOf, matchesQuery } from "./change-groups";
import { kindOfKey } from "./change-kinds";
import { groupByDay, matchesCommit } from "./history-groups";
import type { Change, Commit } from "./types";

const change = (node: string, property = "Texto", before = "a", after = "b"): Change => ({ node, property, before, after });
const commit = (id: string, at: string, message = "m"): Commit => ({ id, branch: "main", message, author: "Ana", at, changes: [change("Inicio · Titular")] });

describe("agrupar cambios", () => {
  it("el grupo es lo primero del nombre", () => {
    expect(groupNameOf("Inicio · Titular")).toBe("Inicio");
    expect(groupNameOf("Navegación")).toBe("Navegación");
  });

  it("agrupa por página conservando el orden", () => {
    const groups = groupChanges([change("Inicio · A"), change("Contacto · B"), change("Inicio · C")]);
    expect(groups.map((g) => [g.name, g.items.length])).toEqual([["Inicio", 2], ["Contacto", 1]]);
  });

  it("la búsqueda exige todas las palabras", () => {
    const c = change("Inicio · Titular", "Color", "#fff", "#000");
    expect(matchesQuery(c, "inicio color")).toBe(true);
    expect(matchesQuery(c, "inicio tamaño")).toBe(false);
    expect(matchesQuery(c, "")).toBe(true);
  });

  it("clasifica los cambios por su clave", () => {
    expect(kindOfKey("external:patch:1")).toBe("external");
    expect(kindOfKey("rule:global:button:radius")).toBe("design");
    expect(kindOfKey("responsive:b1:mobile")).toBe("responsive");
    expect(kindOfKey("page:home")).toBe("content");
  });
});

describe("historial", () => {
  const now = new Date("2026-10-23T12:00:00");

  it("agrupa por día con Hoy y Ayer", () => {
    const groups = groupByDay([commit("a", "2026-10-23T09:00:00"), commit("b", "2026-10-23T08:00:00"), commit("c", "2026-10-22T20:00:00"), commit("d", "2026-10-01T10:00:00")], now);
    expect(groups.map((g) => [g.label, g.commits.length])).toEqual([["Hoy", 2], ["Ayer", 1], ["1 de octubre de 2026", 1]]);
  });

  it("busca en mensaje, autor y cambios", () => {
    const c = commit("x1", "2026-10-23T09:00:00", "Nuevo titular azul");
    expect(matchesCommit(c, "azul")).toBe(true);
    expect(matchesCommit(c, "ana titular")).toBe(true);
    expect(matchesCommit(c, "rojo")).toBe(false);
  });
});
