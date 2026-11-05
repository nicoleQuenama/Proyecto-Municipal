import { combineAccess, isExpired, type Access, type Restriction } from "../components/auth/access";
import type { User, UserRole } from "../components/auth/types";
import type { Tx } from "./db";

/** Quien hace una petición: la persona, su organización y la versión de sesión con que entró. */
export interface Actor {
  user: User;
  orgId: string;
  sessionVersion: number;
}

/** Una cuenta tal como está guardada, con su acceso al proyecto. */
export interface Account {
  user: User;
  /** ¿Tiene acceso visible al proyecto? Si el acceso venció, la base de datos ya no se lo deja ver. */
  member: boolean;
  sessionVersion: number;
  removed: boolean;
  disabled: boolean;
}

interface Row {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  invited_by: string | null;
  session_version: number;
  status: string;
  deleted_at: Date | null;
  member: boolean;
  denied: string[] | null;
  scope_limited: boolean | null;
  expires_at: Date | null;
  scope_pages: string[];
  scope_blocks: string[];
}

/** Las columnas de una cuenta y su fila de acceso al proyecto (el único que tiene la organización por ahora). */
const COLUMNS = (tx: Tx) => tx`
  u.id, u.username, u.name, u.email, u.role, u.invited_by, u.session_version, u.status, u.deleted_at,
  m.user_id is not null as member, m.denied, m.scope_limited, m.expires_at,
  coalesce((select array_agg(s.page_id) from app.member_scope_pages s where s.project_id = m.project_id and s.user_id = u.id), '{}') as scope_pages,
  coalesce((select array_agg(s.block_id) from app.member_scope_blocks s where s.project_id = m.project_id and s.user_id = u.id), '{}') as scope_blocks`;

const MEMBERSHIP = (tx: Tx) => tx`
  left join app.project_members m
    on m.organization_id = u.organization_id and m.user_id = u.id
   and m.project_id = (select id from app.projects where deleted_at is null order by created_at limit 1)`;

/**
 * Lo guardado se traduce al acceso que entiende el editor. Con la fila de partida (sin vetos, sin límite y sin vencimiento)
 * la persona tiene todo lo de su rol. Con el alcance limitado solo puede tocar las páginas y secciones asignadas: sin ninguna,
 * no edita nada.
 */
function accessOf(row: Row): Access | undefined {
  const limited = !!row.scope_limited;
  const denied = (row.denied ?? []) as Restriction[];
  const expiresAt = row.expires_at ? row.expires_at.toISOString() : null;
  if (!row.member || (!limited && denied.length === 0 && !expiresAt)) return undefined;
  return { scope: limited ? { pageIds: row.scope_pages, blockIds: row.scope_blocks } : null, denied, expiresAt };
}

const accountOf = (row: Row): Account => ({
  user: {
    id: row.id,
    username: row.username,
    name: row.name,
    email: row.email,
    role: row.role,
    access: accessOf(row),
    invitedBy: row.invited_by ?? undefined,
  },
  member: row.member,
  sessionVersion: row.session_version,
  removed: row.deleted_at !== null,
  disabled: row.status !== "active",
});

/** Una cuenta, o `null` si no existe en esta organización. */
export async function loadAccount(tx: Tx, id: string): Promise<Account | null> {
  const [row] = await tx<Row[]>`select ${COLUMNS(tx)} from app.users u ${MEMBERSHIP(tx)} where u.id = ${id}`;
  return row ? accountOf(row) : null;
}

/** Varias cuentas (las que cumplan el filtro), de la más antigua a la más reciente. */
export async function loadAccounts(tx: Tx, where: ReturnType<Tx>): Promise<Account[]> {
  const rows = await tx<Row[]>`select ${COLUMNS(tx)} from app.users u ${MEMBERSHIP(tx)} where u.deleted_at is null ${where} order by u.created_at`;
  return rows.map(accountOf);
}

/** Las páginas con sus secciones: lo que hace falta para cruzar dos alcances. */
export type PageShape = { id: string; blocks: { id: string }[] };

const MAX_CHAIN = 6;

/** La cuenta y quienes la invitaron, hacia arriba (la propia primero). */
export async function loadChain(tx: Tx, id: string): Promise<Account[]> {
  const rows = await tx<Row[]>`
    with recursive chain as (
      select u.id, u.invited_by, 0 as depth from app.users u where u.id = ${id}
      union all
      select p.id, p.invited_by, c.depth + 1 from chain c join app.users p on p.id = c.invited_by
      where c.depth < ${MAX_CHAIN}
    )
    select ${COLUMNS(tx)} from chain
      join app.users u on u.id = chain.id ${MEMBERSHIP(tx)}
    order by chain.depth`;
  return rows.map(accountOf);
}

/**
 * Lo que vale hoy para una cuenta: si sigue activa y su acceso real. Nunca más que el de quien la invitó: el alcance es lo
 * que ambos permiten, los vetos se suman y el acceso vence cuando venza el primero. Si quien invitó ya no está, tampoco ella.
 */
export function resolveAccess(chain: Account[], pages: PageShape[], index = 0): { active: boolean; access?: Access } {
  const account = chain[index];
  if (!account || account.removed || account.disabled || isExpired(account.user.access)) return { active: false };
  // Sin acceso visible al proyecto no se entra (vencido o retirado): nunca se interpreta como «sin restricciones».
  if (account.user.role !== "superadmin" && !account.member) return { active: false };
  if (!account.user.invitedBy) return { active: true, access: account.user.access };

  const above = resolveAccess(chain, pages, index + 1);
  if (!above.active) return { active: false };
  const access = combineAccess(account.user.access, above.access, pages);
  return { active: !isExpired(access), access };
}

/** La persona tal como la ve el editor: con su acceso real (el recortado por quien la invitó). */
export const withRealAccess = (user: User, access: Access | undefined): User => ({ ...user, access });
