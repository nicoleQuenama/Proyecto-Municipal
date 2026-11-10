/**
 * Prueba de las unidades contra la app (pnpm dev) y su base de datos, por HTTP:
 *   node --env-file=.env.local scripts/e2e-units.mts          (APP_URL, por defecto http://localhost:3000)
 * Crea dos unidades y dos personas, comprueba que cada una solo ve y toca lo suyo, y deja todo como estaba.
 */
import postgres from "postgres";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const admin = postgres(process.env.DATABASE_ADMIN_URL!, { prepare: false, onnotice: () => undefined, max: 1 });
const H = { "x-portal-request": "1", "content-type": "application/json" };
let failed = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) failed += 1;
  console.log(`${ok ? "ok   " : "FALLO"} ${label}${ok ? "" : ` ${detail}`}`);
};

async function login(email: string, password: string) {
  const response = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: H, body: JSON.stringify({ email, password }) });
  return response.headers.getSetCookie().map((item) => item.split(";")[0]).join("; ");
}
const api = (cookie: string) => async (path: string, method = "GET", body?: unknown) => {
  const response = await fetch(`${BASE}${path}`, { method, headers: { ...H, cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: (await response.json().catch(() => ({}))) as Record<string, any> }; // eslint-disable-line @typescript-eslint/no-explicit-any
};

const tag = Date.now().toString(36);
const superCookie = await login("superadmin@portal.dev", "SuperAdmin2026!");
const root = api(superCookie);
const [org] = await admin`select id from app.organizations where slug = ${process.env.PORTAL_ORG_SLUG ?? "portal"} or id = (select organization_id from app.users where email = 'superadmin@portal.dev')`;
const [project] = await admin`select id from app.projects where organization_id = ${org.id} order by created_at limit 1`;
const [superUser] = await admin`select id from app.users where email = 'superadmin@portal.dev'`;
const mkUser = async (name: string) => {
  const email = `${name}-${tag}@e2e.test`;
  const hash = (await admin`select password_hash from app.users where email = 'superadmin@portal.dev'`)[0].password_hash;
  const [user] = await admin`insert into app.users (organization_id, email, username, name, role, password_hash, invited_by) values (${org.id}, ${email}, ${`${name}-${tag}`}, ${name}, 'dev', ${hash}, ${superUser.id}) returning id`;
  return { id: user.id as string, email };
};
const ana = await mkUser("ana"), beto = await mkUser("beto");

try {
  const zoo = await root("/api/cms/units", "POST", { name: `Zoonosis ${tag}`, kind: "dev", ownerId: null, reviewRequired: false, overrides: [] });
  const salud = await root("/api/cms/units", "POST", { name: `Salud ${tag}`, kind: "dev", ownerId: null, reviewRequired: false, overrides: [] });
  check("el superadmin crea unidades", zoo.status === 201 && salud.status === 201, JSON.stringify(zoo.data));
  check("un nombre repetido es 409", (await root("/api/cms/units", "POST", { name: `Zoonosis ${tag}`, kind: "dev" })).status === 409);
  check("un cuerpo inválido es 400", (await root("/api/cms/units", "POST", { name: "", kind: "x" })).status === 400);
  check("asigna personas", (await root(`/api/cms/units/${zoo.data.id}/members`, "PUT", { userIds: [ana.id] })).status === 200 && (await root(`/api/cms/units/${salud.data.id}/members`, "PUT", { userIds: [beto.id] })).status === 200);

  const anaPass = process.env.E2E_PASSWORD ?? "SuperAdmin2026!";
  await admin`update app.users set password_hash = (select password_hash from app.users where email = 'superadmin@portal.dev') where id in (${ana.id}, ${beto.id})`;
  const A = api(await login(ana.email, anaPass)), B = api(await login(beto.email, anaPass));
  check("quien no es superadmin no administra unidades (403)", (await A("/api/cms/units")).status === 403 && (await A("/api/cms/units", "POST", { name: "X", kind: "dev" })).status === 403);
  const names = await A("/api/cms/units/names");
  check("cualquiera ve los nombres de las unidades", names.status === 200 && names.data.units.length >= 2);

  const page = (id: string, unitId: string | null) => ({ id, name: id, slug: id, isHome: false, ...(unitId ? { unitId } : {}), title: {}, media: [], blocks: [] });
  const putAs = (who: ReturnType<typeof api>, pages: unknown[], order?: string[]) => who("/api/cms/site", "PUT", { pages: { upsert: pages, remove: [], ...(order ? { order } : {}) } });
  // Como el editor: al añadir páginas manda también el orden de todas.
  const existing = (await admin`select id from app.pages where project_id = ${project.id} order by position`).map((row) => row.id as string);
  const first = await putAs(root, [page(`za-${tag}`, zoo.data.id), page(`sa-${tag}`, salud.data.id), page(`gl-${tag}`, null)], [...existing, `za-${tag}`, `sa-${tag}`, `gl-${tag}`]);
  check("el superadmin guarda páginas de las dos unidades y una global", first.status === 200, `${first.status} ${JSON.stringify(first.data)}`);

  const seenA = (await A("/api/cms/site")).data.site?.pages?.map((p: { id: string }) => p.id) ?? [];
  check("ana solo ve su página y la global", seenA.includes(`za-${tag}`) && seenA.includes(`gl-${tag}`) && !seenA.includes(`sa-${tag}`), JSON.stringify(seenA));
  const seenB = (await B("/api/cms/site")).data.site?.pages?.map((p: { id: string }) => p.id) ?? [];
  check("beto solo ve la suya y la global", seenB.includes(`sa-${tag}`) && !seenB.includes(`za-${tag}`), JSON.stringify(seenB));
  check("ana edita su página", (await putAs(A, [{ ...page(`za-${tag}`, zoo.data.id), name: "Editada" }])).status === 200);
  check("ana no edita la de beto (403)", (await putAs(A, [{ ...page(`sa-${tag}`, salud.data.id), name: "Robada" }])).status === 403);
  check("ana no edita la global (403)", (await putAs(A, [{ ...page(`gl-${tag}`, null), name: "Robada" }])).status === 403);
  check("ana envía su página a la unidad de beto", (await putAs(A, [page(`za-${tag}`, salud.data.id)])).status === 200);
  check("y beto ya la ve", ((await B("/api/cms/site")).data.site?.pages ?? []).some((p: { id: string }) => p.id === `za-${tag}`));

  const mine = await A("/api/auth/me");
  check("la sesión de ana lleva sus unidades y puede desplegar", Array.isArray(mine.data.user?.units) && mine.data.user.units.length === 1 && mine.data.user.canDeploy === true, JSON.stringify(mine.data.user));
  check("ana no configura servidores (es de lo global)", (await A("/api/cms/deploy", "PUT", { kind: "ftp", values: {} })).status === 403);
  check("pero sí ve los destinos para desplegar", (await A("/api/cms/deploy")).status === 200);
  check("una unidad con páginas no se borra (409)", (await root(`/api/cms/units/${salud.data.id}`, "DELETE")).status === 409);
} finally {
  await admin`delete from app.pages where project_id = ${project.id} and id like ${"%-" + tag}`;
  await admin`delete from app.unit_members where user_id in (${ana.id}, ${beto.id})`;
  await admin`update app.units set deleted_at = now() where name like ${"%" + tag}`;
  await admin`delete from app.project_members where user_id in (${ana.id}, ${beto.id})`;
  await admin`update app.users set deleted_at = now(), status = 'disabled' where id in (${ana.id}, ${beto.id})`;
  await admin.end();
}
console.log(failed === 0 ? "UNIDADES (HTTP) OK" : `${failed} FALLOS`);
process.exit(failed === 0 ? 0 : 1);
