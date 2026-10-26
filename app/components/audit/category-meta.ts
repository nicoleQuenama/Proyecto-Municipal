import type { Category, Severity } from "./types";
import type { Band } from "./score";

export const CATEGORY_LABELS: Record<Category, string> = {
  performance: "Rendimiento",
  accessibility: "Accesibilidad",
  "best-practices": "Buenas prácticas",
  seo: "SEO",
};

export const CATEGORY_HINTS: Record<Category, string> = {
  performance: "Qué tan rápido carga la página, sobre todo en un móvil con datos.",
  accessibility: "Si cualquier persona puede leer y usar la página, también con lector de pantalla.",
  "best-practices": "Seguridad y limpieza técnica del sitio.",
  seo: "Cómo te encuentran y te muestran Google y las redes.",
};

/** Colores de los anillos (los mismos de Lighthouse). */
export const BAND_COLORS: Record<Band, string> = {
  good: "#0cce6b",
  average: "#ffa400",
  poor: "#ff4e42",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  error: "Error",
  warning: "Aviso",
  info: "Info",
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  error: "#ff4e42",
  warning: "#ffa400",
  info: "#6aa9ff",
};
