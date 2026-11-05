import type { Tx } from "../db";
import type { Scope } from "../site/site-sql";

/** Una rama tal como está en la base de datos. */
export interface BranchRow {
  id: string;
  name: string;
  isMain: boolean;
  baseId: string | null;
  baseName: string | null;
  headId: string | null;
  forkId: string | null;
  ownerId: string | null;
  ownerName: string | null;
}

/** Un error de uso (la rama no existe, no hay cambios…): la API lo devuelve tal cual con su código. */
export class VersionError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

const SELECT = `select b.id, b.name::text as name, b.is_main as "isMain", b.base_branch_id as "baseId", base.name::text as "baseName",
  b.head_commit_id as "headId", b.fork_commit_id as "forkId", b.owner_id as "ownerId", u.name as "ownerName"
  from app.branches b
  left join app.branches base on base.organization_id = b.organization_id and base.project_id = b.project_id and base.id = b.base_branch_id
  left join app.users u on u.organization_id = b.organization_id and u.id = b.owner_id
  where b.organization_id = $1 and b.project_id = $2 and b.deleted_at is null`;

/** Las ramas del proyecto (la principal primero). */
export async function listBranches(tx: Tx, scope: Scope): Promise<BranchRow[]> {
  return (await tx.unsafe(`${SELECT} order by b.is_main desc, b.created_at`, [scope.org, scope.project])) as unknown as BranchRow[];
}

export async function findBranch(tx: Tx, scope: Scope, name: string): Promise<BranchRow> {
  const [row] = (await tx.unsafe(`${SELECT} and b.name = $3`, [scope.org, scope.project, name])) as unknown as BranchRow[];
  if (!row) throw new VersionError(`La rama «${name}» no existe.`, 404);
  return row;
}

export async function findBranchById(tx: Tx, scope: Scope, id: string): Promise<BranchRow> {
  const [row] = (await tx.unsafe(`${SELECT} and b.id = $3`, [scope.org, scope.project, id])) as unknown as BranchRow[];
  if (!row) throw new VersionError("La rama no existe.", 404);
  return row;
}
