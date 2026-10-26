/** Rutas con parámetros (`/pokemon/:id`): reglas puras, sin React. */

export type RouteValues = Record<string, string>;

const PARAM = /:([A-Za-z_]\w*)/g;

/** Los nombres de los parámetros de una ruta, sin repetir y en orden: `/a/:id/:slug` → ["id", "slug"]. */
export const paramsOf = (route: string | undefined): string[] => [
  ...new Set([...(route ?? "").matchAll(PARAM)].map((match) => match[1])),
];

/** Deja la ruta con una `/` delante, sin espacios ni barras de más. `null` si queda vacía o sin parámetros. */
export function normalizeRoute(input: string): string | null {
  const clean = input.trim().replace(/\s+/g, "").replace(/\/{2,}/g, "/").replace(/\/$/, "");
  const route = clean.startsWith("/") ? clean : `/${clean}`;
  return paramsOf(route).length > 0 ? route : null;
}

/** Escribe los valores en la ruta (`/pokemon/:id` + {id: "25"} → `/pokemon/25`); lo que falta queda como `:id`. */
export const fillRoute = (route: string, values: RouteValues): string =>
  route.replace(PARAM, (whole, name: string) => (values[name] ? encodeURIComponent(values[name]) : whole));

/** Los valores que valen ahora: los recibidos y, si faltan, los de ejemplo de la página. Solo los de la ruta. */
export function effectiveParams(
  route: string | undefined,
  preview: RouteValues | undefined,
  given?: RouteValues,
): RouteValues {
  return Object.fromEntries(paramsOf(route).map((name) => [name, given?.[name] || preview?.[name] || ""]));
}
