import { signRealtimeTicket } from "../../../server/realtime-ticket";
import { inProject } from "../../../server/site-access";
import { versionRoute } from "../../../server/versions/version-route";

/** Dónde está el servidor de tiempo real: el mismo equipo que la app, en su propio puerto (o el que diga `REALTIME_URL`). */
function realtimeUrl(request: Request): string {
  if (process.env.REALTIME_URL) return process.env.REALTIME_URL;
  const { hostname, protocol } = new URL(request.url);
  return `${protocol === "https:" ? "wss" : "ws"}://${hostname}:${process.env.REALTIME_PORT ?? 3001}`;
}

/** El boleto de un minuto para entrar al tiempo real y la dirección a la que conectarse. */
export const GET = (request: Request) =>
  versionRoute(request, (actor) =>
    inProject(actor, async (tx, scope) => {
      const [row] = await tx.unsafe(`select app.has_permission($1::uuid, 'editContent') as ok`, [scope.project]);
      // `all` solo si la organización usa unidades: sin ellas el superadmin dejaría de ser visible para los demás.
      const [audience] = await tx.unsafe(`select app.user_unit_ids() as units, (app.is_org_superadmin() and exists (select 1 from app.units where organization_id = app.current_org() and deleted_at is null)) as everyone`);
      const ticket = signRealtimeTicket({ uid: actor.user.id, name: actor.user.name, org: scope.org, project: scope.project, canEdit: row.ok === true, units: audience.units as string[], all: audience.everyone === true });
      return { url: realtimeUrl(request), ticket };
    }),
  );
