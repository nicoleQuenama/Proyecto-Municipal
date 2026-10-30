export type PanelTab =
  | "pages"
  | "templates"
  | "components"
  | "media"
  | "navigation"
  | "appearance"
  | "libraries"
  | "users"
  | "data";
/** «all» o el nombre de una categoría. */
export type ComponentFilter = string;

/** Permiso mínimo para ver cada sección; el menú lateral se filtra con `hasPermission`. */
export type PanelPermission = "editContent" | "editStyles" | "editCode" | "editData" | "installLibraries" | "manageUsers";

/** Las secciones del panel lateral, en el orden de la barra de iconos. */
export const TABS: { value: PanelTab; label: string; title: string; permission: PanelPermission }[] = [
  { value: "pages", label: "Páginas", title: "Páginas del sitio", permission: "editContent" },
  { value: "templates", label: "Plantillas", title: "Plantillas de páginas y secciones prehechas", permission: "editContent" },
  { value: "components", label: "Agregar", title: "Componentes para agregar a la página", permission: "editContent" },
  { value: "media", label: "Archivos", title: "Imágenes y videos del proyecto (tipo Canva)", permission: "editContent" },
  { value: "navigation", label: "Enlaces", title: "Navegación y enlaces entre páginas", permission: "editContent" },
  { value: "appearance", label: "Estilo", title: "Variables y reglas de estilo", permission: "editStyles" },
  { value: "libraries", label: "Librerías", title: "Librerías de código", permission: "installLibraries" },
  { value: "users", label: "Usuarios", title: "Usuarios y permisos del CMS", permission: "manageUsers" },
  { value: "data", label: "Datos", title: "APIs HTTP y sus datos", permission: "editData" },
];
