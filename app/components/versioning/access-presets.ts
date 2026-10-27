import type { Access, Restriction } from "../auth/access";
import type { Permission } from "../auth/auth-context";
import type { User } from "../auth/types";
import { isExpired } from "../auth/access";
import { describeExpiry } from "./expiry";

/** Lo que una persona puede hacer además de editar: cada una se activa o se veta por separado. */
export const ABILITIES: { restriction: Restriction; label: string; hint: string; permission: Permission }[] = [
  { restriction: "installLibraries", label: "Instalar librerías", hint: "Agregar paquetes nuevos al proyecto.", permission: "installLibraries" },
  { restriction: "editCode", label: "Abrir y editar código", hint: "Escribir HTML, CSS y TypeScript de las secciones.", permission: "editCode" },
  { restriction: "editStyles", label: "Cambiar estilos y variables", hint: "Colores, tipografías y reglas de todo el sitio.", permission: "editStyles" },
  { restriction: "editData", label: "Conectar APIs y datos", hint: "Crear o cambiar las fuentes de datos.", permission: "editData" },
  { restriction: "publishMain", label: "Publicar directo en main", hint: "Si no, trabaja en su propia rama y sus cambios llegan como pull request a quien lo invitó.", permission: "publishMain" },
  { restriction: "invite", label: "Invitar a otras personas", hint: "Dar acceso a más gente, siempre con menos permisos que los suyos.", permission: "invite" },
];

/** Cómo se reparte el acceso: a todo, a una parte elegida o solo para mirar. */
export type AccessMode = "all" | "part" | "view";

export const MODES: { id: AccessMode; title: string; description: string }[] = [
  { id: "all", title: "Todo el proyecto", description: "Puede editar cualquier página y sección." },
  { id: "part", title: "Solo una parte", description: "Edita únicamente las páginas o secciones que elijas." },
  { id: "view", title: "Solo mirar", description: "Ve el proyecto pero no puede cambiar nada." },
];

const ALL_RESTRICTIONS = ABILITIES.map((ability) => ability.restriction);

/** El modo que corresponde a un acceso guardado. */
export function modeOf(access: Access | undefined): AccessMode {
  if (!access?.scope) return "all";
  const empty = access.scope.pageIds.length === 0 && access.scope.blockIds.length === 0;
  return empty && ALL_RESTRICTIONS.every((r) => access.denied.includes(r)) ? "view" : "part";
}

/** Los vetos con los que arranca cada modo al elegirlo: «solo mirar» veta todo; «una parte» no deja instalar librerías. */
export const DEFAULT_DENIED: Record<AccessMode, Restriction[]> = {
  all: [],
  part: ["installLibraries", "invite", "publishMain"],
  view: ALL_RESTRICTIONS,
};

/** Lo que muestra la lista de personas: frases cortas sobre dónde trabaja y qué no puede hacer. */
export function describeAccess(user: User): { where: string; limits: string[]; expiry: string; expired: boolean } {
  const { scope, denied = [] } = user.access ?? {};
  const mode = modeOf(user.access);
  const parts = scope ? scope.pageIds.length + scope.blockIds.length : 0;
  const where =
    mode === "all" ? "Todo el proyecto" : mode === "view" ? "Solo puede mirar" : `Edita ${parts} ${parts === 1 ? "parte" : "partes"} del proyecto`;
  const limits = mode === "view" ? [] : ABILITIES.filter((a) => denied.includes(a.restriction)).map((a) => `Sin ${a.label.toLowerCase()}`);
  return { where, limits, expiry: describeExpiry(user.access?.expiresAt), expired: isExpired(user.access) };
}
