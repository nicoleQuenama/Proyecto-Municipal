/** Paleta de colores deterministas para bordes y acentos visuales de unidades municipales. */

export interface UnitColorDef {
  border: string;
  bg: string;
  text: string;
  borderLight: string;
}

export const GLOBAL_UNIT_COLOR: UnitColorDef = {
  border: "#64748b", // slate-500
  bg: "rgba(100, 116, 139, 0.08)",
  text: "#64748b",
  borderLight: "rgba(100, 116, 139, 0.35)",
};

export const UNIT_PALETTE: UnitColorDef[] = [
  {
    border: "#0284c7", // sky-600
    bg: "rgba(2, 132, 199, 0.08)",
    text: "#0284c7",
    borderLight: "rgba(2, 132, 199, 0.4)",
  },
  {
    border: "#059669", // emerald-600
    bg: "rgba(5, 150, 105, 0.08)",
    text: "#059669",
    borderLight: "rgba(5, 150, 105, 0.4)",
  },
  {
    border: "#7c3aed", // violet-600
    bg: "rgba(124, 58, 237, 0.08)",
    text: "#7c3aed",
    borderLight: "rgba(124, 58, 237, 0.4)",
  },
  {
    border: "#d97706", // amber-600
    bg: "rgba(217, 119, 6, 0.08)",
    text: "#d97706",
    borderLight: "rgba(217, 119, 6, 0.4)",
  },
  {
    border: "#e11d48", // rose-600
    bg: "rgba(225, 29, 72, 0.08)",
    text: "#e11d48",
    borderLight: "rgba(225, 29, 72, 0.4)",
  },
  {
    border: "#0891b2", // cyan-600
    bg: "rgba(8, 145, 178, 0.08)",
    text: "#0891b2",
    borderLight: "rgba(8, 145, 178, 0.4)",
  },
  {
    border: "#4f46e5", // indigo-600
    bg: "rgba(79, 70, 229, 0.08)",
    text: "#4f46e5",
    borderLight: "rgba(79, 70, 229, 0.4)",
  },
  {
    border: "#0d9488", // teal-600
    bg: "rgba(13, 148, 136, 0.08)",
    text: "#0d9488",
    borderLight: "rgba(13, 148, 136, 0.4)",
  },
];

/** Obtiene el color visual asignado a una unidad (o el neutro Global si no tiene unidad). */
export function getUnitColor(unitId?: string | null): UnitColorDef {
  if (!unitId) return GLOBAL_UNIT_COLOR;
  let hash = 0;
  for (let i = 0; i < unitId.length; i++) {
    hash = (hash << 5) - hash + unitId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % UNIT_PALETTE.length;
  return UNIT_PALETTE[index];
}
