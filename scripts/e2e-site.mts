/**
 * Prueba de punta a punta del sitio contra el servidor de desarrollo (pnpm dev) y la base de datos (pnpm db:up + pnpm db:seed):
 *   node --env-file=.env.local scripts/e2e-site.mts
 * Crea cosas de prueba, comprueba que se guardan, se leen, respetan los permisos y no se pisan entre editores, y las borra.
 */
import postgres from "postgres";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const admin = postgres(process.env.DATABASE_ADMIN_URL!, { prepare: false, onnotice: () => undefined });
/** Las respuestas son JSON de forma libre: en esta prueba se leen campo a campo. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;
let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail = "") {
  if (ok) passed += 1;
  else failed += 1;
  console.log(`${ok ? "ok   " : "FALLO"} ${label}${ok ? "" : ` ${detail}`}`);
}

async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json", "x-portal-request": "1" }, body: JSON.stringify({ email, password }) });
  if (!response.ok) throw new Error(`login ${email}: ${response.status}`);
  return response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; ");
}

async function call(cookie: string, method: string, path: string, body?: unknown) {
  const response = await fetch(`${BASE}${path}`, { method, headers: { "content-type": "application/json", "x-portal-request": "1", cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: (await response.json().catch(() => ({}))) as Loose };
}

const getSite = async (cookie: string): Promise<Loose> => (await call(cookie, "GET", "/api/cms/site")).data.site;
const put = (cookie: string, patch: unknown) => call(cookie, "PUT", "/api/cms/site", patch);

const page = (id: string, extra: Record<string, unknown> = {}) => ({ id, name: `Prueba ${id}`, slug: id, isHome: false, title: { text: id }, media: [], blocks: [], ...extra });
const ids = (list: { id: string }[]) => list.map((item) => item.id);

const cookie = await login("superadmin@portal.dev", "SuperAdmin2026!");
const before = await getSite(cookie);
const baseOrder = ids(before.pages);

// ───────── Guardar y leer ─────────
const block = {
  id: "blk-e2e",
  componentId: "navbar",
  code: { html: "<b>hola</b>", css: ".a { color: red; }", js: "const a: number = 1;", tailwind: false },
  custom: { $section: { classes: "p-2", css: ".z {\n  margin: 0;\n}" } },
  behaviors: [{ id: "bh-e2e", scope: "$section", trigger: "click", action: { kind: "code", source: "alert(1);", mode: "page" } }],
};
const rich = page("p-e2e", {
  blocks: [block],
  css: "body {\n  margin: 0;\n}",
  js: "let x = 1;",
  animations: [{ id: "an-e2e", name: "Entrada", steps: [{ id: "st-e2e", blockId: "blk-e2e", key: "$section", prop: "opacity", from: 0, to: 1, at: 0, duration: 300 }] }],
});
const saved = await put(cookie, { pages: { upsert: [rich], remove: [], order: [...baseOrder, "p-e2e"] } });
check("guardar una página con sección, código y animación", saved.status === 200 && saved.data.rejectedCode.length === 0, JSON.stringify(saved.data));

const after = await getSite(cookie);
const read = after.pages.find((item: { id: string }) => item.id === "p-e2e");
check("la página vuelve con su sección y el orden pedido", ids(after.pages).join() === [...baseOrder, "p-e2e"].join() && read?.blocks[0]?.componentId === "navbar");
check("el código vuelve completo", read?.js === "let x = 1;" && read?.blocks[0].code.html === "<b>hola</b>" && read?.blocks[0].behaviors[0].action.source === "alert(1);" && read?.blocks[0].custom.$section.css.includes("margin: 0"));
check("los números de la animación siguen siendo números", read?.animations[0].steps[0].from === 0 && read?.animations[0].steps[0].to === 1);

const [{ units }] = await admin`select count(*)::int as units from app.code_units`;
const [{ leaked }] = await admin`select count(*)::int as leaked from app.code_units where ast::text like '%alert(1)%' or ast::text like '%margin: 0%'`;
check("el código se guardó como árboles, sin el texto original dentro", units >= 6 && leaked === 0, `unidades=${units} con_texto=${leaked}`);
const [{ columns }] = await admin`select count(*)::int as columns from information_schema.columns where table_schema = 'app' and column_name in ('css', 'js', 'code', 'global_css', 'transform')`;
check("ninguna columna guarda código en texto", columns === 0);

// ───────── Sin cambios no se escribe ─────────
const [{ v1 }] = await admin`select row_version as v1 from app.pages where id = 'p-e2e'`;
await put(cookie, { pages: { upsert: [rich], remove: [] } });
const [{ v2 }] = await admin`select row_version as v2 from app.pages where id = 'p-e2e'`;
check("guardar lo mismo no escribe nada (sin versión nueva)", v1 === v2, `${v1} → ${v2}`);

// ───────── Código con errores ─────────
const broken = await put(cookie, { pages: { upsert: [{ ...rich, js: "let = = 1" }], remove: [] } });
check("el código con error de sintaxis se rechaza y se avisa", broken.status === 200 && broken.data.rejectedCode.length === 1);
check("…y se conserva la última versión válida", (await getSite(cookie)).pages.find((item: { id: string }) => item.id === "p-e2e").js === "let x = 1;");

// ───────── Variables, funciones y APIs (con secretos cifrados) ─────────
const rest = await put(cookie, {
  variables: [{ id: "v-e2e", scope: { kind: "global" }, name: "e2e", kind: "color", value: "#fff" }],
  functions: { upsert: [{ id: "f-e2e", name: "ping", code: "function ping() {\n  return 1;\n}", scope: { kind: "block", blockId: "blk-e2e" } }], remove: [], order: ["f-e2e"] },
  sources: { upsert: [{ id: "s-e2e", name: "Noticias", url: "https://api.test/x", method: "GET", query: [], headers: [{ key: "Authorization", value: "Bearer SECRETO" }], transform: "data => data.items;", cache: { kind: "ttl", seconds: 60 } }], remove: [], order: ["s-e2e"] },
  comments: { upsert: [{ id: "c-e2e", pageId: "p-e2e", x: 1, y: 2, text: "Revisar", author: "x", at: "2026-11-04T10:00:00.000Z", audience: "team" }], remove: [], order: ["c-e2e"] },
});
check("guardar variables, funciones, APIs y comentarios", rest.status === 200, JSON.stringify(rest.data));
const full = await getSite(cookie);
check("las cabeceras de la API vuelven y no están legibles en la base", full.sources[0].headers[0].value === "Bearer SECRETO" && (await admin`select count(*)::int as n from app.data_source_cache`)[0].n === 0 && (await admin`select position('SECRETO' in encode(headers_enc, 'escape')) as p from app.data_sources where id = 's-e2e'`)[0].p === 0);
check("la función, la transformación y el comentario vuelven", full.functions[0].code.includes("return 1") && full.sources[0].transform === "data => data.items;" && full.comments[0].author === "Super Admin");

// ───────── Dos editores a la vez no se pisan ─────────
const other = await login("superadmin@portal.dev", "SuperAdmin2026!");
await put(cookie, { pages: { upsert: [page("p-a")], remove: [], order: [...baseOrder, "p-e2e", "p-a"] } });
await put(other, { pages: { upsert: [page("p-b")], remove: [], order: [...baseOrder, "p-e2e", "p-b"] } });
const both = ids((await getSite(cookie)).pages);
check("dos editores añaden páginas a la vez y se conservan las dos", both.includes("p-a") && both.includes("p-b"), both.join());
const positions = (await admin`select position from app.pages order by position`).map((row) => row.position);
check("el orden queda sin huecos ni repetidos", positions.every((value, index) => value === index), positions.join());

// ───────── Permisos ─────────
const designer = await login("designer@portal.dev", "Designer2026!");
check("un diseñador edita contenido", (await put(designer, { pages: { upsert: [page("p-d")], remove: [], order: [...both, "p-d"] } })).status === 200);
check("un diseñador no cambia los estilos (rol)", (await put(designer, { variables: [] })).status === 403);
check("un diseñador no escribe código (rol)", (await put(designer, { pages: { upsert: [{ ...rich, js: "let y = 2;" }], remove: [] } })).status === 403);

await call(cookie, "POST", "/api/auth/users", { name: "Sin main", username: "sinmain", email: "sinmain@x.com", role: "designer", password: "Sinmain2026!x" });
const created = (await call(cookie, "GET", "/api/auth/users")).data.users.find((user: { email: string }) => user.email === "sinmain@x.com");
await call(cookie, "PATCH", "/api/auth/users", { id: created.id, access: { scope: null, denied: ["publishMain"], expiresAt: null } });
const restricted = await login("sinmain@x.com", "Sinmain2026!x");
check("quien no puede publicar en main no escribe en main", (await put(restricted, { pages: { upsert: [page("p-x")], remove: [] } })).status === 403);
check("…pero sí puede ver el sitio", (await getSite(restricted)).pages.length > 0);

// ───────── Borrar se lleva lo que cuelga ─────────
await put(cookie, { pages: { upsert: [], remove: ["p-e2e", "p-a", "p-b", "p-d"] }, variables: [], functions: { upsert: [], remove: ["f-e2e"] }, sources: { upsert: [], remove: ["s-e2e"] }, comments: { upsert: [], remove: ["c-e2e"] } });
const [{ left }] = await admin`select (select count(*) from app.pages where id like 'p-%')::int + (select count(*) from app.blocks where id = 'blk-e2e')::int + (select count(*) from app.animation_steps where id = 'st-e2e')::int + (select count(*) from app.code_units where slot like 'behavior.bh-e2e%')::int as left`;
check("borrar la página se lleva sus secciones, animaciones y código", left === 0, `quedan ${left}`);
await call(cookie, "DELETE", `/api/auth/users?id=${created.id}`);
check("el resto del sitio quedó intacto", ids((await getSite(cookie)).pages).join() === baseOrder.join());

console.log(`----\npasaron: ${passed}  fallaron: ${failed}`);
await admin.end();
process.exit(failed === 0 ? 0 : 1);
