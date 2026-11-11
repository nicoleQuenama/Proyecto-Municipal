"use client";

import { useAuth } from "../auth/auth-context";
import { useUnitNames } from "../units/use-unit-names";
import { active, idle, pill } from "./toolbar-parts";
import { useViewport } from "./viewport-context";

/** Filtra las páginas del lienzo por unidad. Solo para quien ve el sitio entero (superadministrador, organizaciones sin unidades): quien está sujeto a unidades cambia de unidad con el selector de la barra y el lienzo lo sigue. */
export function UnitFilter() {
  const names = useUnitNames();
  const { currentUser } = useAuth();
  const { unitFilter, setUnitFilter } = useViewport();
  if (names.length === 0 || currentUser?.units !== undefined) return null;

  return (
    <label title="Mostrar solo las páginas de una unidad" className="flex min-w-0 items-center">
      <span className="sr-only">Filtrar páginas por unidad</span>
      <select
        aria-label="Filtrar páginas por unidad"
        value={unitFilter}
        onChange={(event) => setUnitFilter(event.target.value)}
        className={`${pill} max-w-44 ${unitFilter ? active : `bg-canvas ${idle}`} cursor-pointer`}
      >
        <option value="">Todas las unidades</option>
        <option value="global">Global</option>
        {names.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.name}
          </option>
        ))}
      </select>
    </label>
  );
}
