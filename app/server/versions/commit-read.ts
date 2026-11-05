import type { Commit } from "../../components/versioning/types";
import type { Tx } from "../db";
import type { Scope } from "../site/site-sql";

const MAX_COMMITS = 500;

interface CommitRow {
  id: string;
  branch: string;
  message: string;
  author: string | null;
  at: Date;
  changes: Commit["changes"];
}

export const toCommit = (row: CommitRow): Commit => ({ id: row.id, branch: row.branch, message: row.message, author: row.author ?? "Alguien", at: row.at.toISOString(), changes: row.changes });

const SELECT = `select c.id, b.name::text as branch, c.message, u.name as author, c.created_at as at,
  coalesce((select jsonb_agg(jsonb_build_object('node', ch.node, 'property', ch.property, 'before', coalesce(ch.before_value, ''), 'after', coalesce(ch.after_value, '')) order by ch.id)
            from app.commit_changes ch where ch.organization_id = c.organization_id and ch.project_id = c.project_id and ch.commit_id = c.id), '[]'::jsonb) as changes
  from app.commits c
  join app.branches b on b.organization_id = c.organization_id and b.project_id = c.project_id and b.id = c.branch_id
  left join app.users u on u.organization_id = c.organization_id and u.id = c.author_id
  where c.organization_id = $1 and c.project_id = $2 and b.deleted_at is null`;

/** Las versiones del proyecto, de la más reciente a la más antigua. */
export async function listCommits(tx: Tx, scope: Scope): Promise<Commit[]> {
  const rows = (await tx.unsafe(`${SELECT} order by c.created_at desc, c.id desc limit ${MAX_COMMITS}`, [scope.org, scope.project])) as unknown as CommitRow[];
  return rows.map(toCommit);
}

export async function readCommit(tx: Tx, scope: Scope, id: string): Promise<Commit> {
  const [row] = (await tx.unsafe(`${SELECT} and c.id = $3`, [scope.org, scope.project, id])) as unknown as CommitRow[];
  return toCommit(row);
}
