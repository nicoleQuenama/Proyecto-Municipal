import { FIRST_PAGE, PAGING_KEYS } from "./paging";

/** Un valor que cambia solo: se escribe entre llaves en la URL (`/pokemon/{dayOfYear:1025}`). */
type Token = (arg: string, now: Date, params: Record<string, string>) => string;

const pad = (n: number) => String(n).padStart(2, "0");

const dayOfYear = (now: Date) =>
  Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86_400_000);

/** Los números al azar se mantienen mientras la página siga abierta: la misma clave da el mismo resultado. */
const randoms = new Map<string, number>();

/** Las claves que se reconocen. Una nueva es una entrada nueva. */
const TOKENS: Record<string, Token> = {
  // El día del año (1–366); con un máximo, da la vuelta: {dayOfYear:1025} nunca pasa de 1025.
  dayOfYear: (arg, now) => {
    const max = Number(arg);
    return String(max > 0 ? ((dayOfYear(now) - 1) % max) + 1 : dayOfYear(now));
  },
  today: (_arg, now) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
  // Un entero entre dos números: {random:1-1025}.
  random: (arg) => {
    const [min, max] = arg.split("-").map(Number);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return "";
    if (!randoms.has(arg)) randoms.set(arg, min + Math.floor(Math.random() * (max - min + 1)));
    return String(randoms.get(arg));
  },
  // El parámetro de la página en pantalla: {param:id} en una página `/pokemon/:id`. Sin valor, queda sin cambiar.
  param: (arg, _now, params) => params[arg] ?? `{param:${arg}}`,
  // La paginación de la sección que usa la fuente (ver `pagingParams`): el servidor entrega solo la página que se ve.
  page: (_arg, _now, params) => params[PAGING_KEYS.page] ?? "1",
  offset: (_arg, _now, params) => params[PAGING_KEYS.offset] ?? "0",
  limit: (_arg, _now, params) => params[PAGING_KEYS.limit] ?? String(FIRST_PAGE.size),
};

/** Cambia las claves entre llaves por su valor de ahora; las que no se conocen quedan como estaban. */
export function expandTokens(text: string, now: Date = new Date(), params: Record<string, string> = {}): string {
  return text.replace(/\{(\w+)(?::([^}]*))?\}/g, (whole, name: string, arg = "") =>
    name in TOKENS ? TOKENS[name](arg, now, params) : whole,
  );
}

/** Las claves disponibles con un ejemplo, para enseñarlas en el editor de la fuente. */
export const TOKEN_HELP: { token: string; text: string }[] = [
  { token: "{dayOfYear:1025}", text: "El día del año, de 1 a 1025: cambia cada día" },
  { token: "{today}", text: "La fecha de hoy (2026-10-23)" },
  { token: "{random:1-1025}", text: "Un número al azar entre dos valores" },
  { token: "{page}", text: "La página que se ve (1, 2, 3…): la API entrega solo esa página" },
  { token: "{offset}", text: "Cuántos elementos saltar: (página − 1) × tamaño de página" },
  { token: "{limit}", text: "Cuántos elementos trae cada página" },
  { token: "{param:id}", text: "El parámetro de la página dinámica en pantalla (ruta /pokemon/:id)" },
];

/** ¿La URL pide la página al servidor? Entonces la paginación no recorta la lista: la API ya la trae por páginas. */
export const usesServerPaging = (...texts: string[]): boolean => texts.some((text) => /\{(page|offset)\}/.test(text));
