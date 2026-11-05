/**
 * Prueba de las imágenes contra la app (pnpm dev), la base de datos y ImageKit de verdad:
 *   node --env-file=.env.local scripts/e2e-media.mts
 * Sube una imagen mínima, comprueba que ImageKit la sirve, que repetirla no la sube de nuevo, que lo disfrazado y lo enorme se
 * rechaza, y al terminar la borra de ImageKit y de la base (la cuota vuelve a su sitio).
 */
import { spawnSync } from "node:child_process";
import postgres from "postgres";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const admin = postgres(process.env.DATABASE_ADMIN_URL!, { prepare: false, onnotice: () => undefined });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;
let passed = 0;
let failed = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (ok) passed += 1;
  else failed += 1;
  console.log(`${ok ? "ok   " : "FALLO"} ${label}${ok ? "" : ` ${detail}`}`);
};

const login = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json", "x-portal-request": "1" }, body: JSON.stringify({ email: "superadmin@portal.dev", password: "SuperAdmin2026!" }) });
const cookie = login.headers.getSetCookie().map((item) => item.split(";")[0]).join("; ");

// Una imagen distinta en cada corrida (el contenido repetido no se sube dos veces).
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==", "base64");
const unique = Buffer.concat([png, Buffer.from(`${Date.now()}`)]);

async function upload(name: string, data: Buffer) {
  const form = new FormData();
  form.set("file", new Blob([new Uint8Array(data)]), name);
  const response = await fetch(`${BASE}/api/cms/assets`, { method: "POST", headers: { "x-portal-request": "1", cookie }, body: form });
  return { status: response.status, data: (await response.json().catch(() => ({}))) as Loose };
}

const [usageBefore] = await admin`select coalesce(sum(storage_bytes), 0)::bigint as n from app.organization_usage`;
const first = await upload("Mi Logo ñandú.png", unique);
check("sube una imagen", first.status === 201 && first.data.media?.url?.includes("/org/"), JSON.stringify(first.data));
check("el nombre queda limpio y con el tipo real", /-mi-logo-nandu\.png$/.test(first.data.media?.url ?? ""), first.data.media?.url);

const served = await fetch(first.data.media.url);
check("ImageKit la sirve como imagen", served.status === 200 && (served.headers.get("content-type") ?? "").startsWith("image/"), String(served.status));

const again = await upload("otro-nombre.png", unique);
check("repetir el mismo contenido no la sube de nuevo", again.data.media?.id === first.data.media.id);
const [usageAfter] = await admin`select coalesce(sum(storage_bytes), 0)::bigint as n from app.organization_usage`;
check("la cuota se cobra una sola vez", Number(usageAfter.n) - Number(usageBefore.n) === unique.length, `${usageBefore.n} → ${usageAfter.n}`);

check("lo disfrazado de imagen se rechaza", (await upload("falso.png", Buffer.from("<script>alert(1)</script>"))).status === 415);
check("lo demasiado grande se rechaza", (await upload("grande.png", Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(11 * 1024 * 1024)]))).status === 413);

const unauthenticated = await fetch(`${BASE}/api/cms/assets`, { method: "POST", headers: { "x-portal-request": "1" }, body: new FormData() });
check("sin sesión no se sube nada", unauthenticated.status === 401);

// ───────── Cuota de almacenamiento ─────────
const usage = async () => (await (await fetch(`${BASE}/api/cms/assets`, { headers: { "x-portal-request": "1", cookie } })).json()) as Loose;
const reported = await usage();
check("el medidor informa lo usado, el plan y los archivos", reported.usage?.usedBytes === Number(usageAfter.n) && reported.usage.maxBytes > 0 && reported.usage.files >= 1 && reported.usage.configured === true, JSON.stringify(reported));
check("sin sesión no se ve la cuota", (await fetch(`${BASE}/api/cms/assets`, { headers: { "x-portal-request": "1" } })).status === 401);

// Con el plan casi lleno, la subida se rechaza con un mensaje claro y no deja nada a medias.
const [org] = await admin`select id, max_storage_bytes::text as max from app.organizations where id = (select organization_id from app.assets where id = ${first.data.media.id})`;
await admin`update app.organizations set max_storage_bytes = ${usageAfter.n} where id = ${org.id}`;
const full = await upload("no-cabe.png", Buffer.concat([png, Buffer.from(`lleno-${Date.now()}`)]));
const [afterFull] = await admin`select count(*)::int as n, coalesce(sum(storage_bytes), 0)::bigint as used from app.assets, app.organization_usage`;
check("con la cuota llena la subida se rechaza con un mensaje claro", full.status === 409 && /cuota/i.test(full.data.error ?? ""), JSON.stringify(full));
check("y no queda ninguna ficha a medias ni se cobra de más", Number(afterFull.used) === Number(usageAfter.n), JSON.stringify(afterFull));
await admin`update app.organizations set max_storage_bytes = ${org.max} where id = ${org.id}`;
const roomy = await upload("ya-cabe.png", Buffer.concat([png, Buffer.from(`amplio-${Date.now()}`)]));
check("al ampliar el plan se puede volver a subir", roomy.status === 201);
{
  // Esta prueba no deja nada: ni en la base ni en ImageKit.
  const [row] = await admin`select id, imagekit_file_id from app.assets where id = ${roomy.data.media?.id ?? null}`;
  if (row) {
    await fetch(`https://api.imagekit.io/v1/files/${row.imagekit_file_id}`, { method: "DELETE", headers: { authorization: `Basic ${Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString("base64")}` } });
    await admin`delete from app.assets where id = ${row.id}`;
  }
}

// ───────── Entrega optimizada y limpieza programada ─────────
const optimized = await fetch(`${first.data.media.url}?tr=f-auto,q-auto`);
check("ImageKit entrega la versión optimizada (formato y calidad automáticos)", optimized.status === 200 && (optimized.headers.get("content-type") ?? "").startsWith("image/"), String(optimized.status));

const kept = await upload("la-que-se-usa.png", Buffer.concat([png, Buffer.from(`uso-${Date.now()}`)]));
const authorization = `Basic ${Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString("base64")}`;
const exists = async (fileId: string) => (await fetch(`https://api.imagekit.io/v1/files/${fileId}/details`, { headers: { authorization } })).status === 200;
const [unusedRow] = await admin`select id, imagekit_file_id from app.assets where id = ${first.data.media.id}`;
const [usedRow] = await admin`select id, imagekit_file_id from app.assets where id = ${kept.data.media.id}`;

// Las dos «tienen 10 días»; solo una aparece en el diseño (en los ajustes del proyecto).
await admin`update app.assets set created_at = now() - interval '10 days' where id in (${unusedRow.id}, ${usedRow.id})`;
await admin`update app.projects set settings = settings || ${admin.json({ e2eMediaRef: kept.data.media.url })} where id = (select project_id from app.assets where id = ${usedRow.id})`;
const dry = spawnSync(process.execPath, ["--env-file=.env.local", "scripts/maintenance.mts", "--dry"], { encoding: "utf8" });
check("la simulación dice qué sobra sin borrar nada", dry.stdout.includes("sobraría") && dry.stdout.includes("(simulación)") && (await exists(unusedRow.imagekit_file_id)), dry.stdout + dry.stderr);

const cleaned = spawnSync(process.execPath, ["--env-file=.env.local", "scripts/maintenance.mts"], { encoding: "utf8" });
const [still] = await admin`select count(*)::int as n from app.assets where id = ${unusedRow.id}`;
check("el mantenimiento borra el archivo que nadie usa, de la base y de ImageKit", cleaned.status === 0 && still.n === 0 && !(await exists(unusedRow.imagekit_file_id)), cleaned.stdout + cleaned.stderr);
const [keep] = await admin`select count(*)::int as n from app.assets where id = ${usedRow.id}`;
check("y no toca el que está en el diseño", keep.n === 1 && (await exists(usedRow.imagekit_file_id)));

// Limpieza: lo que dejó esta prueba.
await admin`update app.projects set settings = settings - 'e2eMediaRef' where id = (select project_id from app.assets where id = ${usedRow.id})`;
const removed = await fetch(`https://api.imagekit.io/v1/files/${usedRow.imagekit_file_id}`, { method: "DELETE", headers: { authorization } });
await admin`delete from app.assets where id = ${usedRow.id}`;
const [usageEnd] = await admin`select coalesce(sum(storage_bytes), 0)::bigint as n from app.organization_usage`;
check("al terminar, ImageKit y la cuota quedan como al empezar", removed.status === 204 && Number(usageEnd.n) === Number(usageBefore.n), `${removed.status} ${usageEnd.n}`);

await admin.end();
console.log(`\n${passed} bien, ${failed} mal`);
process.exit(failed === 0 ? 0 : 1);
