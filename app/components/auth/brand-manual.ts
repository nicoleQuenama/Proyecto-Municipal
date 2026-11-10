import type { PaletteOption } from "../section-colors/palette-select";
import type { Variable } from "../styles/types";
import { FONT_OPTIONS } from "../title-editor/constants";
import type { User } from "./types";

/** Colores base del manual de marca si el sitio aún no define variables de color. */
export const DEFAULT_BRAND_COLORS: PaletteOption[] = [
  { name: "color-primario", value: "#0d99ff" },
  { name: "color-fondo", value: "#f8fafc" },
  { name: "color-texto", value: "#171717" },
  { name: "color-acento", value: "#6366f1" },
  { name: "color-blanco", value: "#ffffff" },
  { name: "color-exito", value: "#10b981" },
  { name: "color-alerta", value: "#f59e0b" },
  { name: "color-peligro", value: "#ef4444" },
];

/** Tipografías base del manual de marca */
export const BRAND_FONT_OPTIONS = [
  { value: "var(--font-geist-sans), sans-serif", label: "Titulares y Marca (Geist)" },
  { value: "Arial, Helvetica, sans-serif", label: "Cuerpo y Lectura (Arial)" },
];

/**
 * Determina si el usuario está sujeto a las restricciones estrictas del manual de marca.
 * - Los diseñadores (`designer`) o cuentas sin permiso de editar estilos no pueden usar colores
 *   arbitrarios ni fuentes fuera del manual corporativo.
 * - Los superadministradores (`superadmin`) y desarrolladores tienen libertad técnica para definir tokens.
 */
export function isRestrictedByBrand(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === "designer" || (user.access?.denied.includes("editStyles") ?? false);
}

/**
 * Obtiene la lista de colores autorizados por el manual de marca para este sitio.
 * Lee las variables globales de color definidas por el superadministrador, o el fallback corporativo.
 */
export function getBrandColors(variables: Variable[] = []): PaletteOption[] {
  const fromVars = variables
    .filter((v) => v.kind === "color" && v.value)
    .filter((v, idx, all) => all.findIndex((item) => item.value === v.value) === idx)
    .map((v) => ({ name: v.name, value: v.value }));

  if (fromVars.length > 0) {
    // Si no incluye blanco o negro básico, asegurarse de que estén disponibles para contrastes
    const hasWhite = fromVars.some((c) => c.value.toLowerCase() === "#ffffff");
    const hasBlack = fromVars.some((c) => c.value.toLowerCase() === "#171717" || c.value.toLowerCase() === "#000000");
    const extras: PaletteOption[] = [];
    if (!hasWhite) extras.push({ name: "blanco", value: "#ffffff" });
    if (!hasBlack) extras.push({ name: "texto-oscuro", value: "#171717" });
    return [...fromVars, ...extras];
  }

  return DEFAULT_BRAND_COLORS;
}

/**
 * Obtiene la lista de tipografías autorizadas por el manual de marca.
 * Si el superadministrador definió variables de tipo fuente (p. ej. `--fuente-titulos`, `--fuente-cuerpo`),
 * esas son las autorizadas; si no, retorna las tipografías corporativas base.
 */
export function getBrandFonts(variables: Variable[] = []): { value: string; label: string }[] {
  const fontVars = variables.filter((v) => v.kind === "font" && v.value);
  if (fontVars.length > 0) {
    return fontVars.map((v) => ({
      value: v.value,
      label: `${v.name} (${FONT_OPTIONS.find((f) => f.value === v.value)?.label ?? v.value})`,
    }));
  }

  return BRAND_FONT_OPTIONS;
}
