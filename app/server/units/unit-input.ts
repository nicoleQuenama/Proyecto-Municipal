import { VersionError } from "../versions/branch-rows";
import type { UnitKind } from "./types";

export interface UnitOverride {
  permission: string;
  allowed: boolean;
}

export interface UnitInput {
  name: string;
  kind: UnitKind;
  ownerId: string | null;
  reviewRequired: boolean;
  overrides: UnitOverride[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KINDS: readonly string[] = ["designer", "dev"];
/** Lo que se puede ajustar por unidad (administrar usuarios nunca es de una unidad). */
const PERMISSIONS: readonly string[] = ["viewAll", "editContent", "editStyles", "editCode", "editData", "installLibraries", "invite", "publishMain", "viewAudit", "deploy", "comment"];

const bad = (message: string): never => {
  throw new VersionError(message, 400);
};
const asObject = (body: unknown): Record<string, unknown> => (typeof body === "object" && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : bad("Falta el cuerpo de la petición."));

function parseOverrides(value: unknown): UnitOverride[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return bad("Los ajustes de permisos deben ser una lista.");
  const seen = new Set<string>();
  return value.map((item) => {
    const entry = asObject(item);
    if (typeof entry.permission !== "string" || !PERMISSIONS.includes(entry.permission)) return bad("Ese permiso no se puede ajustar por unidad.");
    if (typeof entry.allowed !== "boolean") return bad("Cada ajuste debe decir si el permiso se concede o se quita.");
    if (seen.has(entry.permission)) return bad("Un permiso no se ajusta dos veces.");
    seen.add(entry.permission);
    return { permission: entry.permission, allowed: entry.allowed };
  });
}

/** Lo que llega al crear o editar una unidad, validado y normalizado (lanza 400 con un mensaje para la persona). */
export function parseUnitInput(body: unknown): UnitInput {
  const input = asObject(body);
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length < 1 || name.length > 120) bad("El nombre de la unidad debe tener entre 1 y 120 caracteres.");
  if (typeof input.kind !== "string" || !KINDS.includes(input.kind)) bad("El tipo de la unidad es «designer» (diseñador) o «dev» (desarrollador).");
  const ownerId = input.ownerId ?? null;
  if (ownerId !== null && (typeof ownerId !== "string" || !UUID.test(ownerId))) bad("El dueño de la unidad no es válido.");
  if (input.reviewRequired !== undefined && typeof input.reviewRequired !== "boolean") bad("La revisión obligatoria debe ser verdadero o falso.");
  return { name, kind: input.kind as UnitKind, ownerId: ownerId as string | null, reviewRequired: input.reviewRequired === true, overrides: parseOverrides(input.overrides) };
}

/** Una lista de ids de personas (`userIds`), sin repetir. */
export function parseIds(body: unknown): string[] {
  const { userIds } = asObject(body);
  if (!Array.isArray(userIds) || !userIds.every((id) => typeof id === "string" && UUID.test(id))) return bad("Envía la lista de personas como ids.");
  return [...new Set(userIds as string[])];
}
