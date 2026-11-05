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
      const ticket = signRealtimeTicket({ uid: actor.user.id, name: actor.user.name, org: scope.org, project: scope.project, canEdit: row.ok === true });
      return { url: realtimeUrl(request), ticket };
    }),
  );
