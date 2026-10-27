/** Hasta cuándo dura un acceso: reglas puras de fechas, sin React. */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Las duraciones que se ofrecen de un clic. Una nueva es una entrada nueva. */
export const DURATIONS: { id: string; label: string; days: number }[] = [
  { id: "1w", label: "1 semana", days: 7 },
  { id: "2w", label: "2 semanas", days: 14 },
  { id: "1m", label: "1 mes", days: 30 },
];

/** La fecha en que vence un acceso que dura `days` días desde `now` (al final de ese día). */
export function expiryIn(days: number, now = Date.now()): string {
  const end = new Date(now + days * DAY_MS);
  end.setHours(23, 59, 59, 0);
  return end.toISOString();
}

/** Una fecha escrita en un campo de fecha (AAAA-MM-DD) como vencimiento, al final de ese día; null si no es válida. */
export function expiryOnDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const end = new Date(`${value}T23:59:59`);
  return Number.isNaN(end.getTime()) ? null : end.toISOString();
}

/** El valor de un campo de fecha (AAAA-MM-DD) para un vencimiento, en la hora local. */
export function dateInputValue(expiresAt: string | null | undefined): string {
  if (!expiresAt) return "";
  const date = new Date(expiresAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** «Vence el 2 nov (en 7 días)», «Venció hace 3 días» o «Sin fecha de vencimiento». */
export function describeExpiry(expiresAt: string | null | undefined, now = Date.now()): string {
  if (!expiresAt) return "Sin fecha de vencimiento";
  const time = Date.parse(expiresAt);
  const days = Math.ceil(Math.abs(time - now) / DAY_MS);
  const when = new Date(time).toLocaleDateString("es", { day: "numeric", month: "short" });
  if (time <= now) return days <= 1 ? "Venció hoy" : `Venció hace ${days} días`;
  return days <= 1 ? `Vence hoy (${when})` : `Vence el ${when} (en ${days} días)`;
}
