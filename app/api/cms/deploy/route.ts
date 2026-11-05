import type { Actor } from "../../../server/auth-accounts";
import { sessionActor } from "../../../server/auth-session";
import { canDeploy } from "../../../server/can-deploy";
import { DEPLOYERS } from "../../../server/deployers";
import { collectBundle } from "../../../server/export-bundle";
import { isTargetKind, listTargets, readTargetWithSecrets, removeTarget, saveTarget, TARGET_FIELDS } from "../../../server/deploy-targets";
import { sameOriginRequest } from "../../../server/proxy-guard";
import type { Tx } from "../../../server/db";
import type { Scope } from "../../../server/site/site-sql";
import { inProject } from "../../../server/site-access";
import { liveSite } from "../../../server/versions/publication-store";
import { versionRoute } from "../../../server/versions/version-route";
import { VersionError } from "../../../server/versions/branch-rows";

/** Entra solo quien puede desplegar; todo lo demás es 401 o 403. */
async function allowed(request: Request): Promise<Response | null> {
  if (!sameOriginRequest(request)) return Response.json({ error: "Petición no permitida." }, { status: 403 });
  const actor = await sessionActor();
  if (!actor) return Response.json({ error: "Tu sesión terminó." }, { status: 401 });
  return canDeploy(actor.user) ? null : Response.json({ error: "No tienes permiso para configurar servidores." }, { status: 403 });
}

/** Como `versionRoute`, pero solo para quien puede desplegar. */
const deployRoute = async (request: Request, work: (actor: Actor) => Promise<unknown>) => (await allowed(request)) ?? versionRoute(request, work);

/** Los destinos guardados (sin sus secretos) y qué datos pide cada tipo. */
/** Los últimos despliegues del proyecto, con quién los hizo y cómo salieron. */
async function history(tx: Tx, scope: Scope) {
  return (
    await tx.unsafe(
      `select d.status, d.error, d.created_at as "at", t.kind, u.name as "by" from app.deployments d
       left join app.deploy_targets t on t.organization_id = d.organization_id and t.project_id = d.project_id and t.id = d.target_id
       left join app.users u on u.organization_id = d.organization_id and u.id = d.triggered_by
       where d.organization_id = $1 and d.project_id = $2 order by d.created_at desc limit 8`,
      [scope.org, scope.project],
    )
  ).map((row) => ({ kind: row.kind as string | null, status: row.status as string, error: row.error as string | null, at: (row.at as Date).toISOString(), by: row.by as string | null }));
}

export const GET = (request: Request) =>
  deployRoute(request, async (actor) => ({ ...(await inProject(actor, async (tx, scope) => ({ targets: await listTargets(tx, scope), history: await history(tx, scope) }))), kinds: TARGET_FIELDS }));

export async function PUT(request: Request) {
  const { kind, values } = (await request.json().catch(() => ({}))) as { kind?: unknown; values?: Record<string, string> };
  if (!isTargetKind(kind) || !values) return Response.json({ error: "Destino no válido." }, { status: 400 });
  return deployRoute(request, async (actor) => {
    await inProject(actor, (tx, scope) => saveTarget(tx, scope, actor.user.id, kind, values));
    return { ok: true };
  });
}

export async function DELETE(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind");
  if (!isTargetKind(kind)) return Response.json({ error: "Destino no válido." }, { status: 400 });
  return deployRoute(request, async (actor) => {
    await inProject(actor, (tx, scope) => removeTarget(tx, scope, kind));
    return { ok: true };
  });
}

/**
 * Prueba la conexión de un destino (`action: "test"`) o despliega a él la publicación en línea (por defecto) y deja constancia.
 * En Vercel se despliega la aplicación; en FTP, SFTP y cPanel se sube el mismo paquete que el ZIP del proyecto (con el sitio
 * publicado dentro), pensado para servidores donde puedas ejecutar Node (VPS, o la «aplicación Node.js» de cPanel).
 */
export async function POST(request: Request) {
  const { kind, action } = (await request.json().catch(() => ({}))) as { kind?: unknown; action?: unknown };
  if (!isTargetKind(kind)) return Response.json({ error: "Destino no válido." }, { status: 400 });

  return deployRoute(request, async (actor) => {
    const target = await inProject(actor, (tx, scope) => readTargetWithSecrets(tx, scope, kind));
    if (!target) throw new VersionError("Primero guarda los datos de este destino.", 400);
    const deployer = DEPLOYERS[kind];

    if (action === "test") {
      const tested = await deployer.test(target.values, target.secrets);
      if (!tested.ok) throw new VersionError(tested.error, 502);
      return tested;
    }

    const prepared = await inProject(actor, async (tx, scope) => {
      const live = await liveSite(tx, scope);
      if (!live) throw new VersionError("Publica primero: se despliega lo que está publicado.", 409);
      const [run] = await tx.unsafe(
        `insert into app.deployments (organization_id, project_id, publication_id, target_id, status, triggered_by, started_at)
         select $1::uuid, $2::uuid, $3::uuid, t.id, 'running', $4::uuid, now() from app.deploy_targets t where t.organization_id = $1 and t.project_id = $2 and t.kind = $5 returning id`,
        [scope.org, scope.project, live.id, actor.user.id, kind],
      );
      return { live, run: run.id as string };
    });

    const result = await deployer.deploy(target.values, target.secrets, await collectBundle("zip", JSON.stringify(prepared.live.snapshot)));
    await inProject(actor, (tx, scope) =>
      tx.unsafe(`update app.deployments set status = $4, error = $5, finished_at = now() where organization_id = $1 and project_id = $2 and id = $3`, [scope.org, scope.project, prepared.run, result.ok ? "succeeded" : "failed", result.ok ? null : result.error]),
    );
    if (!result.ok) throw new VersionError(result.error, 502);
    return result;
  });
}
