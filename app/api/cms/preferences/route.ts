import { withOrg } from "../../../server/db";
import { PREFERENCE_KEY, readPreferences, writePreference } from "../../../server/preferences";
import { versionRoute } from "../../../server/versions/version-route";

/** Las preferencias de esta persona (atajos, disposición del inspector, modo avanzado…): le siguen a cualquier dispositivo. */
export const GET = (request: Request) => versionRoute(request, async (actor) => ({ preferences: await withOrg(actor.orgId, actor.user.id, readPreferences) }));

/** Guarda una: `{ key, value }`. */
export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as { key?: unknown; value?: unknown } | null;
  if (typeof body?.key !== "string" || !PREFERENCE_KEY.test(body.key) || body.value === undefined) return Response.json({ error: "Preferencia no válida." }, { status: 400 });
  const { key, value } = body;
  return versionRoute(request, async (actor) => {
    await withOrg(actor.orgId, actor.user.id, (tx) => writePreference(tx, actor.orgId, actor.user.id, key, value));
    return { ok: true };
  });
}
