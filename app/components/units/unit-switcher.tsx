"use client";

import { useAuth } from "../auth/auth-context";
import { useSite, useSiteDispatch } from "../site/site-context";
import { storeUnit } from "./active-unit";

/** Elegir en qué unidad se trabaja. Solo aparece si hay algo que elegir: quien está en una sola unidad no ve nada. */
export function UnitSwitcher() {
  const { currentUser } = useAuth();
  const site = useSite();
  const dispatch = useSiteDispatch();
  const units = currentUser?.units;
  const canGlobal = currentUser?.canEditGlobal === true;
  if (!units || units.length + (canGlobal ? 1 : 0) < 2) return null;

  return (
    <label className="flex items-center gap-2 border-r border-line px-3 text-xs text-ink-dim">
      <span>Unidad</span>
      <select
        aria-label="Unidad en la que trabajas"
        value={site.activeUnitId ?? "global"}
        onChange={(event) => {
          const unitId = event.target.value === "global" ? null : event.target.value;
          storeUnit(unitId);
          dispatch({ type: "unit/set-active", unitId });
        }}
        className="h-7 max-w-40 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent cursor-pointer"
      >
        {units.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.name}
          </option>
        ))}
        {canGlobal && <option value="global">Global</option>}
      </select>
    </label>
  );
}
