import type { Issue, Label, LabelTone } from "../../components/versioning/types";
import type { Tx } from "../db";
import type { Scope } from "../site/site-sql";
import { VersionError } from "./branch-rows";

/** Las etiquetas de fábrica: se crean la primera vez que un proyecto las necesita. */
const DEFAULT_LABELS: Label[] = [
  { name: "Bug", tone: "danger" },
  { name: "Diseño", tone: "accent" },
  { name: "Mejora", tone: "success" },
];
const TONES: LabelTone[] = ["neutral", "accent", "success", "danger", "warning"];
const MAX_TITLE = 300;

export interface IssuesPayload {
  issues: Issue[];
  labels: Label[];
  /** Quienes tienen acceso al proyecto: a ellos se puede asignar un issue. */
  people: string[];
}

const text = (value: unknown, max: number): string => (typeof value === "string" ? value.trim().slice(0, max) : "");

async function readLabels(tx: Tx, scope: Scope): Promise<Label[]> {
  const query = () => tx.unsafe(`select name::text as name, tone from app.issue_labels where organization_id = $1 and project_id = $2 order by name`, [scope.org, scope.project]);
  let rows = await query();
  if (rows.length === 0) {
    await tx.unsafe(
      `insert into app.issue_labels (organization_id, project_id, name, tone) select $1::uuid, $2::uuid, r.name, r.tone from jsonb_to_recordset($3::jsonb) as r(name text, tone text) on conflict do nothing`,
      [scope.org, scope.project, DEFAULT_LABELS as never],
    );
    rows = await query();
  }
  return rows as unknown as Label[];
}

/** Issues, etiquetas y personas asignables del proyecto. */
export async function readIssues(tx: Tx, scope: Scope): Promise<IssuesPayload> {
  const labels = await readLabels(tx, scope);
  const issues = (await tx.unsafe(
    `select i.number, i.title, coalesce(l.name::text, '') as label, coalesce(u.name, 'Alguien') as author, i.is_open as open,
       coalesce((select jsonb_agg(au.name order by au.name) from app.issue_assignees a join app.users au on au.organization_id = a.organization_id and au.id = a.user_id
                 where a.organization_id = i.organization_id and a.project_id = i.project_id and a.issue_id = i.id), '[]'::jsonb) as assignees
     from app.issues i
     left join app.issue_labels l on l.organization_id = i.organization_id and l.project_id = i.project_id and l.id = i.label_id
     left join app.users u on u.organization_id = i.organization_id and u.id = i.author_id
     where i.organization_id = $1 and i.project_id = $2 order by i.number desc`,
    [scope.org, scope.project],
  )) as unknown as Issue[];
  const people = (
    await tx.unsafe(
      `select u.name from app.users u where u.organization_id = $1 and u.deleted_at is null
         and (u.role = 'superadmin' or exists (select 1 from app.project_members m where m.organization_id = u.organization_id and m.project_id = $2 and m.user_id = u.id))
       order by u.name`,
      [scope.org, scope.project],
    )
  ).map((row) => row.name as string);
  return { issues, labels, people };
}

async function issueId(tx: Tx, scope: Scope, number: number): Promise<string> {
  const [row] = await tx.unsafe(`select id from app.issues where organization_id = $1 and project_id = $2 and number = $3`, [scope.org, scope.project, number]);
  if (!row) throw new VersionError("No existe ese issue.", 404);
  return row.id as string;
}

export interface NewIssue {
  title: unknown;
  label: unknown;
  tone: unknown;
  assignees: unknown;
}

async function assign(tx: Tx, scope: Scope, id: string, names: string[]): Promise<void> {
  await tx.unsafe(
    `insert into app.issue_assignees (organization_id, project_id, issue_id, user_id)
     select $1::uuid, $2::uuid, $3::uuid, u.id from app.users u
     where u.organization_id = $1::uuid and u.deleted_at is null and u.name = any($4::text[])
       and (u.role = 'superadmin' or exists (select 1 from app.project_members m where m.organization_id = u.organization_id and m.project_id = $2::uuid and m.user_id = u.id))
     on conflict do nothing`,
    [scope.org, scope.project, id, names],
  );
}

export async function createIssue(tx: Tx, scope: Scope, userId: string, input: NewIssue): Promise<void> {
  const title = text(input.title, MAX_TITLE);
  const name = text(input.label, 40);
  if (!title || !name) throw new VersionError("Faltan el título o la etiqueta.", 400);
  const tone = TONES.includes(input.tone as LabelTone) ? (input.tone as string) : "neutral";
  await readLabels(tx, scope);

  await tx.unsafe(`insert into app.issue_labels (organization_id, project_id, name, tone) values ($1, $2, $3, $4) on conflict (organization_id, project_id, name) do nothing`, [scope.org, scope.project, name, tone]);
  const [created] = await tx.unsafe(
    `insert into app.issues (organization_id, project_id, number, title, label_id, author_id)
     select $1::uuid, $2::uuid, app.next_number($2::uuid, 'issue'), $3, l.id, $4::uuid from app.issue_labels l where l.organization_id = $1::uuid and l.project_id = $2::uuid and l.name = $5 returning id`,
    [scope.org, scope.project, title, userId, name],
  );
  const names = Array.isArray(input.assignees) ? input.assignees.filter((item): item is string => typeof item === "string") : [];
  if (names.length > 0) await assign(tx, scope, created.id as string, names);
}

export async function toggleIssue(tx: Tx, scope: Scope, number: number): Promise<void> {
  await tx.unsafe(
    `update app.issues set is_open = not is_open, closed_at = case when is_open then now() else null end where organization_id = $1 and project_id = $2 and number = $3`,
    [scope.org, scope.project, number],
  );
}

/** Asigna a esa persona si no lo estaba; si ya lo estaba, la quita. */
export async function toggleAssignee(tx: Tx, scope: Scope, number: number, member: unknown): Promise<void> {
  const id = await issueId(tx, scope, number);
  const name = text(member, 100);
  const removed = await tx.unsafe(
    `delete from app.issue_assignees a using app.users u where a.organization_id = $1 and a.project_id = $2 and a.issue_id = $3 and u.organization_id = a.organization_id and u.id = a.user_id and u.name = $4 returning 1`,
    [scope.org, scope.project, id, name],
  );
  if (removed.length === 0) await assign(tx, scope, id, [name]);
}
