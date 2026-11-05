import type { Access } from "../components/auth/access";
import type { Actor, PageShape } from "./auth-accounts";
import type { Tx } from "./db";

/** El proyecto de la organización en el que se guardan los accesos (por ahora, el único que se usa). */
export async function currentProject(tx: Tx): Promise<string> {
  const [project] = await tx<{ id: string }[]>`select id from app.projects where deleted_at is null order by created_at limit 1`;
  if (!project) throw new Error("La organización todavía no tiene ningún proyecto.");
  return project.id;
}

/** Las páginas con sus secciones: hace falta para saber qué secciones caben en el alcance de dos personas a la vez. */
export async function pagesOf(tx: Tx): Promise<PageShape[]> {
  const rows = await tx<{ page: string; block: string | null }[]>`
    select p.id as page, b.id as block from app.pages p left join app.blocks b on b.project_id = p.project_id and b.page_id = p.id
    where p.project_id = (select id from app.projects where deleted_at is null order by created_at limit 1)`;
  const pages = new Map<string, PageShape>();
  for (const row of rows) {
    const page = pages.get(row.page) ?? { id: row.page, blocks: [] };
    if (row.block) page.blocks.push({ id: row.block });
    pages.set(row.page, page);
  }
  return [...pages.values()];
}

/** Guarda (o actualiza) el acceso de una cuenta al proyecto: vetos, alcance (páginas y secciones asignadas) y vencimiento. */
export async function saveMember(tx: Tx, actor: Actor, projectId: string, userId: string, access?: Access): Promise<void> {
  await tx`
    insert into app.project_members (organization_id, project_id, user_id, member_role, denied, scope_limited, expires_at, granted_by)
    values (${actor.orgId}, ${projectId}, ${userId}, 'editor', ${access?.denied ?? []},
            ${access?.scope != null}, ${access?.expiresAt ?? null}::timestamptz, ${actor.user.id})
    on conflict (organization_id, project_id, user_id) do update set
      denied = excluded.denied, scope_limited = excluded.scope_limited, expires_at = excluded.expires_at, granted_by = excluded.granted_by`;

  // Lo asignado se reemplaza entero. La base de datos exige que cada página y sección exista en este proyecto
  // y borra la asignación sola si luego se elimina.
  await tx`delete from app.member_scope_pages where project_id = ${projectId} and user_id = ${userId}`;
  await tx`delete from app.member_scope_blocks where project_id = ${projectId} and user_id = ${userId}`;
  const pages = access?.scope?.pageIds ?? [];
  const blocks = access?.scope?.blockIds ?? [];
  if (pages.length > 0) {
    await tx`insert into app.member_scope_pages (organization_id, project_id, user_id, page_id)
             select ${actor.orgId}, ${projectId}, ${userId}, unnest(${pages}::text[])`;
  }
  if (blocks.length > 0) {
    await tx`insert into app.member_scope_blocks (organization_id, project_id, user_id, block_id)
             select ${actor.orgId}, ${projectId}, ${userId}, unnest(${blocks}::text[])`;
  }
}
