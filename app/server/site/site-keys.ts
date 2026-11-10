/**
 * Qué claves del estado del sitio tiene cada cosa. Sin dependencias: la usan el servidor (al guardar) y el editor
 * (al calcular qué cambió).
 */

/** Lo que es de cada persona y de cada pantalla (qué está seleccionado, en qué página está) no se comparte: no se guarda. */
export const SCREEN_KEYS = ["currentPageId", "selectedId", "selectedElementId", "alsoSelectedIds", "selectedBlockIds", "activeUnitId"] as const;

/** Las claves del sitio que tienen tabla propia; todo lo demás viaja en `projects.settings` y no se pierde. */
export const MAPPED_KEYS = ["navigation", "pages", "comments", "components", "libraries", "globalCss", "functions", "sources", "variables", "rules", ...SCREEN_KEYS];
