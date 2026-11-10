import { describe, expect, it } from "vitest";
import type { User } from "../auth/types";
import { filterPeople, NO_FILTER, unitsOfUser } from "./filter-people";

const user = (id: string, name: string, role: User["role"]): User => ({ id, name, role, username: id, email: `${id}@x.bo` });
const users = [user("ana", "Ana Peña", "designer"), user("beto", "Beto", "dev"), user("cami", "Camila", "designer")];
const units = [{ id: "u1", memberIds: ["ana", "beto"] }, { id: "u2", memberIds: ["beto"] }];

describe("filterPeople", () => {
  it("sin filtro devuelve a todas", () => expect(filterPeople(users, units, NO_FILTER)).toHaveLength(3));
  it("busca sin importar tildes ni mayúsculas", () => expect(filterPeople(users, units, { ...NO_FILTER, query: "PENA" }).map((u) => u.id)).toEqual(["ana"]));
  it("busca por correo", () => expect(filterPeople(users, units, { ...NO_FILTER, query: "cami@" }).map((u) => u.id)).toEqual(["cami"]));
  it("filtra por rol", () => expect(filterPeople(users, units, { ...NO_FILTER, role: "dev" }).map((u) => u.id)).toEqual(["beto"]));
  it("filtra por unidad", () => expect(filterPeople(users, units, { ...NO_FILTER, unitId: "u1" }).map((u) => u.id)).toEqual(["ana", "beto"]));
  it("combina filtros", () => expect(filterPeople(users, units, { query: "", role: "designer", unitId: "u1" }).map((u) => u.id)).toEqual(["ana"]));
  it("las unidades de una persona", () => expect(unitsOfUser(units, "beto").map((u) => u.id)).toEqual(["u1", "u2"]));
});
