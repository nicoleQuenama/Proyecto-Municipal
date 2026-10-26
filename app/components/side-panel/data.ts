export type PanelTab =
  | "pages"
  | "components"
  | "navigation"
  | "appearance"
  | "libraries"
  | "users"
  | "data"
  | "site";
/** «all» o el nombre de una categoría. */
export type ComponentFilter = string;

/** Las secciones del panel lateral, en el orden de la barra de iconos. */
export const TABS: { value: PanelTab; label: string; title: string }[] = [
  { value: "pages", label: "Páginas", title: "Páginas del sitio" },
  { value: "components", label: "Agregar", title: "Componentes para agregar a la página" },
  { value: "navigation", label: "Enlaces", title: "Navegación y enlaces entre páginas" },
  { value: "appearance", label: "Estilo", title: "Variables y reglas de estilo" },
  { value: "libraries", label: "Librerías", title: "Librerías de código" },
  { value: "users", label: "Usuarios", title: "Usuarios y permisos del CMS" },
  { value: "data", label: "Datos", title: "APIs HTTP y sus datos" },
  { value: "site", label: "Sitio", title: "Web existente del cliente" },
];
