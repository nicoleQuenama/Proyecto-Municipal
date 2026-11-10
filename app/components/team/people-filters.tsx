import { ROLE_LABELS, type UserRole } from "../auth/types";
import { ROLE_OPTIONS } from "../auth/user-ui";
import type { PeopleFilter } from "./filter-people";

interface Props {
  filter: PeopleFilter;
  onChange: (filter: PeopleFilter) => void;
}

const control = "h-10 rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent";

/** Buscar por nombre, usuario o correo y acotar por rol. (La unidad se elige en la lista de la izquierda.) */
export function PeopleFilters({ filter, onChange }: Props) {
  return (
    <div className="flex gap-3">
      <input aria-label="Buscar personas" type="search" value={filter.query} onChange={(event) => onChange({ ...filter, query: event.target.value })} placeholder="Buscar por nombre, usuario o correo…" className={`${control} min-w-0 flex-1`} />
      <select aria-label="Filtrar por rol" value={filter.role} onChange={(event) => onChange({ ...filter, role: event.target.value as UserRole | "" })} className={control}>
        <option value="">Todos los roles</option>
        {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
      </select>
    </div>
  );
}
