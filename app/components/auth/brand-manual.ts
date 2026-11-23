import type { PaletteOption } from "../section-colors/palette-select";
import type { Variable } from "../styles/types";
import { FONT_OPTIONS } from "../title-editor/constants";
import type { User } from "./types";

/**
 * Paleta Oficial del Manual de Marca del Gobierno Autónomo Municipal de Cochabamba (G.A.M.C.)
 * Valores HEX y roles de diseño definidos institucionalmente.
 */
export const GAMC_BRAND_TOKENS = {
  // Primaria (Institucional)
  primary: "#00A7D6",        // Celeste Saturado - Color dominante
  primaryHover: "#008BB3",   // Hover (oscurecido 15%)
  primaryLight: "#34C3E8",   // Celeste Medio (Desaturación 1)
  primarySoft: "#8AD4E7",    // Celeste Claro (Desaturación 2)
  primaryTint: "#E6F6FB",    // Celeste Tint (fondo suave de tarjetas destacadas)

  // Secundaria (Contraste Institucional)
  secondary: "#462D81",      // Morado Oscuro / Índigo
  secondaryLight: "#695CA8", // Lila / Violeta Medio

  // Acentos (Por Gamas)
  accentWarm: "#F47B38",     // Naranja (Gama Cálida) - Notificaciones y llamados urgentes
  accentPink: "#F05D80",     // Rosa Intenso (Gama Media) - Cultura y campañas sociales
  accentTeal: "#0DA593",     // Verde Azulado / Teal (Gama Fría) - Ciudad Jardín / Sostenibilidad

  // Semántica / Estados UI
  success: "#0DA593",        // Éxito
  successBg: "#ABDBCB",      // Menta Claro (Fondo)
  warning: "#F47B38",        // Advertencia
  warningBg: "#FFE6C2",      // Crema / Arena (Fondo)
  warningHighlight: "#FFDA18",// Amarillo (Badges de atención)
  error: "#A91E5D",          // Guindo / Magenta Oscuro (Errores críticos)
  errorBg: "#F5C3C0",        // Rosa Pastel (Fondo suave de error)
  info: "#00A7D6",           // Información

  // Neutros y Superficies (60% de la interfaz)
  bgMain: "#FFFFFF",         // Blanco puro (Fondo principal)
  bgSurface: "#F8FAFC",      // Gris claro (Fondo de tarjetas, paneles)
  borderSubtle: "#E2E8F0",   // Divisores y bordes

  // Tipografía (WCAG AA/AAA)
  textPrimary: "#0F172A",    // Negro azulado (Slate 900) - Títulos y cuerpo
  textSecondary: "#475569",  // Gris medio (Slate 600) - Subtítulos y descripciones
  textMuted: "#94A3B8",      // Gris suave (Slate 400) - Metadatos y fechas
  textOnPrimary: "#FFFFFF",  // Blanco sobre primario o secundario

  // Gamut complementario adicional
  salmon: "#F58C80",         // Salmón / Coral
  greenGarden: "#78C47B",    // Verde Jardín
} as const;

/** Colores base del manual de marca para variables de diseño del sitio. */
export const DEFAULT_BRAND_COLORS: PaletteOption[] = [
  { name: "color-primario", value: "#00A7D6" },
  { name: "color-primario-hover", value: "#008BB3" },
  { name: "color-primario-light", value: "#34C3E8" },
  { name: "color-primario-soft", value: "#8AD4E7" },
  { name: "color-primario-tint", value: "#E6F6FB" },
  { name: "color-secundario", value: "#462D81" },
  { name: "color-secundario-light", value: "#695CA8" },
  { name: "color-acento-calido", value: "#F47B38" },
  { name: "color-acento-rosa", value: "#F05D80" },
  { name: "color-acento-teal", value: "#0DA593" },
  { name: "color-exito", value: "#0DA593" },
  { name: "color-exito-bg", value: "#ABDBCB" },
  { name: "color-alerta", value: "#F47B38" },
  { name: "color-alerta-bg", value: "#FFE6C2" },
  { name: "color-alerta-amarillo", value: "#FFDA18" },
  { name: "color-error", value: "#A91E5D" },
  { name: "color-error-bg", value: "#F5C3C0" },
  { name: "color-fondo", value: "#FFFFFF" },
  { name: "color-superficie", value: "#F8FAFC" },
  { name: "color-borde", value: "#E2E8F0" },
  { name: "color-texto", value: "#0F172A" },
  { name: "color-texto-secundario", value: "#475569" },
  { name: "color-texto-suave", value: "#94A3B8" },
  { name: "color-blanco", value: "#FFFFFF" },
];

/** Opciones de color de texto según el manual de marca (accesibles según WCAG) */
export const BRAND_TEXT_COLORS: PaletteOption[] = [
  { name: "Texto Principal (#0F172A)", value: "#0F172A" },
  { name: "Texto Secundario (#475569)", value: "#475569" },
  { name: "Texto Suave / Fecha (#94A3B8)", value: "#94A3B8" },
  { name: "Blanco (#FFFFFF)", value: "#FFFFFF" },
  { name: "Celeste Primario (#00A7D6)", value: "#00A7D6" },
  { name: "Morado Secundario (#462D81)", value: "#462D81" },
  { name: "Naranja Cálido (#F47B38)", value: "#F47B38" },
  { name: "Rosa Acento (#F05D80)", value: "#F05D80" },
  { name: "Verde Azulado / Teal (#0DA593)", value: "#0DA593" },
  { name: "Guindo Crítico (#A91E5D)", value: "#A91E5D" },
];

/** Opciones de color de superficie y fondo según el manual de marca */
export const BRAND_SURFACE_COLORS: PaletteOption[] = [
  { name: "Blanco Puro (#FFFFFF)", value: "#FFFFFF" },
  { name: "Superficie Tarjetas (#F8FAFC)", value: "#F8FAFC" },
  { name: "Celeste Tint - Suave (#E6F6FB)", value: "#E6F6FB" },
  { name: "Celeste Claro - Soft (#8AD4E7)", value: "#8AD4E7" },
  { name: "Celeste Medio (#34C3E8)", value: "#34C3E8" },
  { name: "Celeste Saturado (#00A7D6)", value: "#00A7D6" },
  { name: "Morado Secundario (#462D81)", value: "#462D81" },
  { name: "Lila Medio (#695CA8)", value: "#695CA8" },
  { name: "Naranja Acento (#F47B38)", value: "#F47B38" },
  { name: "Rosa Acento (#F05D80)", value: "#F05D80" },
  { name: "Verde Azulado / Teal (#0DA593)", value: "#0DA593" },
  { name: "Alerta Fondo - Crema (#FFE6C2)", value: "#FFE6C2" },
  { name: "Éxito Fondo - Menta (#ABDBCB)", value: "#ABDBCB" },
  { name: "Error Fondo - Rosa Pastel (#F5C3C0)", value: "#F5C3C0" },
  { name: "Borde Sutil (#E2E8F0)", value: "#E2E8F0" },
  { name: "Oscuro Institucional / Pie (#0F172A)", value: "#0F172A" },
  { name: "Transparente", value: "transparent" },
];

/** Opciones de color de fondo para tarjetas en contenedores */
export const BRAND_CARD_COLORS: PaletteOption[] = [
  { name: "Blanco (#FFFFFF)", value: "#FFFFFF" },
  { name: "Superficie (#F8FAFC)", value: "#F8FAFC" },
  { name: "Celeste Tint (#E6F6FB)", value: "#E6F6FB" },
  { name: "Celeste Claro (#8AD4E7)", value: "#8AD4E7" },
  { name: "Celeste Primario (#00A7D6)", value: "#00A7D6" },
  { name: "Morado Secundario (#462D81)", value: "#462D81" },
  { name: "Crema Alerta (#FFE6C2)", value: "#FFE6C2" },
  { name: "Menta Éxito (#ABDBCB)", value: "#ABDBCB" },
  { name: "Rosa Error (#F5C3C0)", value: "#F5C3C0" },
];

/** Presets de roles de botones para alternar estilos de forma instantánea y conforme a accesibilidad */
export interface BrandButtonPreset {
  id: string;
  name: string;
  fill: string;
  color: string;
  description: string;
}

export const BRAND_BUTTON_PRESETS: BrandButtonPreset[] = [
  {
    id: "primary",
    name: "Primario (Celeste)",
    fill: "#00A7D6",
    color: "#FFFFFF",
    description: "Botón principal institucional",
  },
  {
    id: "secondary",
    name: "Secundario (Morado)",
    fill: "#462D81",
    color: "#FFFFFF",
    description: "Alto contraste institucional",
  },
  {
    id: "secondary-light",
    name: "Secundario Claro (Lila)",
    fill: "#695CA8",
    color: "#FFFFFF",
    description: "Hover o botón alternativo",
  },
  {
    id: "accent-warm",
    name: "Acento Naranja",
    fill: "#F47B38",
    color: "#FFFFFF",
    description: "Llamados urgentes y alertas",
  },
  {
    id: "accent-teal",
    name: "Acento Verde Azulado",
    fill: "#0DA593",
    color: "#FFFFFF",
    description: "Ciudad Jardín y medio ambiente",
  },
  {
    id: "accent-pink",
    name: "Acento Rosa",
    fill: "#F05D80",
    color: "#FFFFFF",
    description: "Cultura y campañas sociales",
  },
  {
    id: "surface",
    name: "Neutro (Superficie)",
    fill: "#F8FAFC",
    color: "#0F172A",
    description: "Botón neutral o cancelar",
  },
  {
    id: "error",
    name: "Destructivo (Guindo)",
    fill: "#A91E5D",
    color: "#FFFFFF",
    description: "Acciones críticas o eliminar",
  },
];

/** Tipografías base del manual de marca (Roboto para interfaz y Roboto Serif para editorial) */
export const BRAND_FONT_OPTIONS = [
  { value: "Roboto, var(--font-geist-sans), sans-serif", label: "UI, Títulos y Botones (Roboto)" },
  { value: "'Roboto Serif', Georgia, serif", label: "Editorial y Artículos (Roboto Serif)" },
];

/**
 * Determina si el usuario está sujeto a las restricciones del manual de marca.
 * - Los diseñadores (`designer`), editores (`editor`) o cuentas sin permiso global
 *   solo pueden usar colores y tipografías aprobados en el manual corporativo.
 * - Los superadministradores (`superadmin`) y desarrolladores tienen permiso de administrar tokens globales.
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
    const hasBlack = fromVars.some((c) => c.value.toLowerCase() === "#171717" || c.value.toLowerCase() === "#000000" || c.value.toLowerCase() === "#0f172a");
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
