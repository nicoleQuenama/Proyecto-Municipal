import type { User, UserRole } from "../auth/types";

export interface PeopleFilter {
  query: string;
  role: UserRole | "";
  unitId: string;
}

export const NO_FILTER: PeopleFilter = { query: "", role: "", unitId: "" };

interface UnitLike {
  id: string;
  memberIds: string[];
}

const plain = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Las personas que cumplen la búsqueda (nombre, usuario o correo), el rol y la unidad elegidos. Sin filtro, todas. */
export function filterPeople(users: User[], units: UnitLike[], filter: PeopleFilter): User[] {
  const query = plain(filter.query.trim());
  const members = new Set(units.find((unit) => unit.id === filter.unitId)?.memberIds ?? []);
  return users.filter((user) => {
    if (filter.role && user.role !== filter.role) return false;
    if (filter.unitId && !members.has(user.id)) return false;
    return !query || plain(`${user.name} ${user.username} ${user.email}`).includes(query);
  });
}

/** Las unidades a las que pertenece una persona, en el orden de la lista de unidades. */
export function unitsOfUser<T extends UnitLike>(units: T[], userId: string): T[] {
  return units.filter((unit) => unit.memberIds.includes(userId));
}
