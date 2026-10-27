import type { User } from "./types";

/** Lo que se le puede quitar a una persona aunque su rol lo permita. */
export type Restriction = "installLibraries" | "editCode" | "editStyles" | "editData" | "invite" | "publishMain";

export const RESTRICTION_LABELS: Record<Restriction, string> = {
  installLibraries: "No puede instalar librerías",
  editCode: "No puede abrir ni editar código",
  editStyles: "No puede cambiar estilos y variables",
  editData: "No puede cambiar las APIs y sus datos",
  invite: "No puede invitar a otras personas",
  publishMain: "No puede publicar directo en main (trabaja en su rama y envía pull requests)",
};

/** Qué páginas (enteras) y qué secciones sueltas puede tocar; sin límite (`null`) puede tocar todo. */
export interface Scope {
  pageIds: string[];
  blockIds: string[];
}

/** El acceso limitado de una cuenta: dónde puede trabajar, qué tiene vetado y hasta cuándo. */
export interface Access {
  scope: Scope | null;
  denied: Restriction[];
  /** Fecha (ISO) en que el acceso vence; sin ella (`null`) no vence. Pasada, la cuenta ya no puede entrar. */
  expiresAt?: string | null;
}

export const NO_LIMITS: Access = { scope: null, denied: [] };

/** ¿Puede esta persona editar esa sección? Sin límite de alcance, sí; con él, solo en lo que se le asignó. */
export function canEditBlock(user: User | null | undefined, pageId: string, blockId: string): boolean {
  const scope = user?.access?.scope;
  return !scope || scope.pageIds.includes(pageId) || scope.blockIds.includes(blockId);
}

/** ¿Tiene la restricción puesta? */
export const isDenied = (user: User | null | undefined, restriction: Restriction): boolean =>
  user?.access?.denied.includes(restriction) ?? false;

/** ¿Ya venció el acceso? */
export const isExpired = (access: Pick<Access, "expiresAt"> | undefined, now = Date.now()): boolean =>
  !!access?.expiresAt && Date.parse(access.expiresAt) <= now;

const RESTRICTIONS = Object.keys(RESTRICTION_LABELS) as Restriction[];
const isRestriction = (value: string): value is Restriction => RESTRICTIONS.includes(value as Restriction);

const strings = (list: unknown): string[] | null =>
  Array.isArray(list) && list.every((item) => typeof item === "string") ? (list as string[]) : null;

/** Valida lo que llega por la red antes de guardarlo como acceso de una cuenta. */
export function parseAccess(value: unknown): Access | null {
  if (typeof value !== "object" || value === null) return null;
  const { scope, denied, expiresAt } = value as { scope?: unknown; denied?: unknown; expiresAt?: unknown };

  const deniedList = strings(denied);
  if (!deniedList) return null;
  if (expiresAt != null && (typeof expiresAt !== "string" || Number.isNaN(Date.parse(expiresAt)))) return null;
  const common = { denied: deniedList.filter(isRestriction), expiresAt: (expiresAt as string | null | undefined) ?? null };

  if (scope === null) return { scope: null, ...common };
  const { pageIds, blockIds } = (scope ?? {}) as { pageIds?: unknown; blockIds?: unknown };
  const pages = strings(pageIds);
  const blocks = strings(blockIds);
  return pages && blocks ? { scope: { pageIds: pages, blockIds: blocks }, ...common } : null;
}

interface PageShape {
  id: string;
  blocks: { id: string }[];
}

/** Lo que dos alcances permiten a la vez: solo lo que está en ambos. Sin páginas conocidas, lo más estricto. */
function intersectScope(a: Scope | null, b: Scope | null, pages: PageShape[]): Scope | null {
  if (!a) return b;
  if (!b) return a;
  const inScope = (scope: Scope, pageId: string, blockId?: string) =>
    scope.pageIds.includes(pageId) || (blockId !== undefined && scope.blockIds.includes(blockId));

  const pageIds = a.pageIds.filter((id) => b.pageIds.includes(id));
  const blockIds = pages
    .filter((page) => !pageIds.includes(page.id))
    .flatMap((page) => page.blocks.filter((block) => inScope(a, page.id, block.id) && inScope(b, page.id, block.id)))
    .map((block) => block.id);
  return { pageIds, blockIds };
}

const earliest = (a?: string | null, b?: string | null): string | null => (a && b ? (Date.parse(a) <= Date.parse(b) ? a : b) : (a ?? b ?? null));

/**
 * Lo que de verdad puede una persona invitada: nunca más que quien la invitó. El alcance es lo que ambos permiten,
 * los vetos se suman y el acceso vence cuando venza el primero de los dos.
 */
export function combineAccess(member: Access | undefined, owner: Access | undefined, pages: PageShape[]): Access | undefined {
  if (!owner) return member;
  const mine = member ?? NO_LIMITS;
  return {
    scope: intersectScope(mine.scope, owner.scope, pages),
    denied: [...new Set([...mine.denied, ...owner.denied])],
    expiresAt: earliest(mine.expiresAt, owner.expiresAt),
  };
}
