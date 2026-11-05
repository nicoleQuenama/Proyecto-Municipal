import type { PullRequest } from "../../components/versioning/types";
import type { Tx } from "../db";
import type { Scope } from "../site/site-sql";

type Row = Omit<PullRequest, "conflicts" | "reviewerName"> & { reviewerName: string | null };

const SELECT = `select pr.number, pr.title, fb.name::text as "from", ib.name::text as "into", au.name as author, pr.status,
  pr.required_approvals as "requiredApprovals", pr.author_id as "authorId", pr.reviewer_id as "reviewerId", ru.name as "reviewerName",
  coalesce((select jsonb_agg(u.name order by a.approved_at) from app.pull_request_approvals a
            join app.users u on u.organization_id = a.organization_id and u.id = a.user_id
            where a.organization_id = pr.organization_id and a.project_id = pr.project_id and a.pull_request_id = pr.id), '[]'::jsonb) as approvals,
  coalesce((select jsonb_agg(jsonb_build_object('node', ch.node, 'property', ch.property, 'before', coalesce(ch.before_value, ''), 'after', coalesce(ch.after_value, ''),
                                                'author', coalesce(cu.name, ''), 'at', c.created_at, 'commitId', c.id) order by c.created_at, ch.id)
            from app.pull_request_commits prc
            join app.commits c on c.organization_id = prc.organization_id and c.project_id = prc.project_id and c.id = prc.commit_id
            join app.commit_changes ch on ch.organization_id = c.organization_id and ch.project_id = c.project_id and ch.commit_id = c.id
            left join app.users cu on cu.organization_id = c.organization_id and cu.id = c.author_id
            where prc.organization_id = pr.organization_id and prc.project_id = pr.project_id and prc.pull_request_id = pr.id), '[]'::jsonb) as changes
  from app.pull_requests pr
  join app.branches fb on fb.organization_id = pr.organization_id and fb.project_id = pr.project_id and fb.id = pr.from_branch_id
  join app.branches ib on ib.organization_id = pr.organization_id and ib.project_id = pr.project_id and ib.id = pr.into_branch_id
  join app.users au on au.organization_id = pr.organization_id and au.id = pr.author_id
  left join app.users ru on ru.organization_id = pr.organization_id and ru.id = pr.reviewer_id
  where pr.organization_id = $1 and pr.project_id = $2`;

const toPullRequest = ({ reviewerName, ...row }: Row): PullRequest => ({ ...row, conflicts: [], reviewerName: reviewerName ?? "el superadministrador" });

/** Las que esta persona envió o le toca revisar (la base de datos filtra el resto), de la más reciente a la más antigua. */
export async function listPullRequests(tx: Tx, scope: Scope): Promise<PullRequest[]> {
  return ((await tx.unsafe(`${SELECT} order by pr.number desc`, [scope.org, scope.project])) as unknown as Row[]).map(toPullRequest);
}

export async function readPullRequest(tx: Tx, scope: Scope, id: string): Promise<PullRequest> {
  const [row] = (await tx.unsafe(`${SELECT} and pr.id = $3`, [scope.org, scope.project, id])) as unknown as Row[];
  return toPullRequest(row);
}
