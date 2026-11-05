/**
 * Prueba de punta a punta de ramas, versiones y pull requests contra el servidor de desarrollo (pnpm dev) y la base de datos:
 *   node --env-file=.env.local scripts/e2e-versions.mts
 * Una cuenta sin permiso para publicar en main trabaja en su rama, guarda versiones y envía una pull request; el
 * superadministrador (quien la invitó) la fusiona. Limpia las páginas y la cuenta que crea (las versiones quedan: son inmutables).
 */
const BASE = process.env.APP_URL ?? "http://localhost:3000";
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

const page = (id: string, name = `Prueba ${id}`) => ({ id, name, slug: id, isHome: false, title: { text: id }, media: [], blocks: [] });
const pageIds = (site: Loose) => (site?.pages ?? []).map((item: { id: string }) => item.id);
/** Añade páginas a una rama: como el editor, envía también el orden de la lista. */
async function addPages(cookie: string, branch: string, ...pages: { id: string }[]) {
  const site = (await call(cookie, "GET", `/api/cms/site?branch=${branch}`)).data.site;
  return call(cookie, "PUT", `/api/cms/site?branch=${branch}`, { pages: { upsert: pages, remove: [], order: [...pageIds(site), ...pages.map((item) => item.id)] } });
}
const stamp = Date.now().toString(36);

const sa = await login("superadmin@portal.dev", "SuperAdmin2026!");

// ───────── Una versión inicial en main ─────────
const first = await call(sa, "GET", "/api/cms/versions");
check("el superadministrador ve main con su versión inicial", first.status === 200 && first.data.branches[0].name === "main" && first.data.commits.length >= 1 && first.data.mine === "main", JSON.stringify(first.data).slice(0, 200));

// ───────── Una cuenta sin permiso para publicar en main ─────────
const email = `ramas-${stamp}@x.com`;
await call(sa, "POST", "/api/auth/users", { name: "Ramas Prueba", username: `ramas${stamp}`, email, role: "designer", password: "Ramas2026!x" });
const created = (await call(sa, "GET", "/api/auth/users")).data.users.find((user: { email: string }) => user.email === email);
await call(sa, "PATCH", "/api/auth/users", { id: created.id, access: { scope: null, denied: ["publishMain"], expiresAt: null } });
const rv = await login(email, "Ramas2026!x");
const mine = `trabajo-ramas${stamp}`;

const entry = await call(rv, "GET", "/api/cms/versions");
check("quien no publica en main recibe su rama de trabajo", entry.data.mine === mine && entry.data.branches.some((branch: { name: string }) => branch.name === mine), JSON.stringify(entry.data.branches));
check("no puede escribir directo en main", (await addPages(rv, "main", page(`p-${stamp}`))).status === 403);

// ───────── Trabajar en la rama ─────────
const pv = `pv-${stamp}`;
const mainBefore = (await call(sa, "GET", "/api/cms/site?branch=main")).data.site;
const branchSite = (await call(rv, "GET", `/api/cms/site?branch=${mine}`)).data;
check("la rama parte del estado de main", JSON.stringify(pageIds(branchSite.site)) === JSON.stringify(pageIds(mainBefore)), JSON.stringify(pageIds(branchSite.site)));
check("guarda su edición en la rama", (await addPages(rv, mine, page(pv))).status === 200);
check("la rama tiene la edición", pageIds((await call(rv, "GET", `/api/cms/site?branch=${mine}`)).data.site).includes(pv));
check("main no la tiene", !pageIds((await call(sa, "GET", "/api/cms/site?branch=main")).data.site).includes(pv));
check("la versión de partida no cambia hasta guardar una versión", !pageIds((await call(rv, "GET", `/api/cms/site?branch=${mine}`)).data.head).includes(pv));

const saved = await call(rv, "POST", "/api/cms/versions", { branch: mine, message: "Agrego una página", changes: [{ node: "Página", property: "Nombre", before: "—", after: pv }] });
check("guarda una versión", saved.status === 201 && saved.data.commit.changes.length === 1 && saved.data.commit.branch === mine, JSON.stringify(saved.data));
check("la versión ya es la de partida", pageIds((await call(rv, "GET", `/api/cms/site?branch=${mine}`)).data.head).includes(pv));
check("sin cambios no hay versión nueva", (await call(rv, "POST", "/api/cms/versions", { branch: mine, message: "Otra" })).status === 409);
check("no puede guardar versiones en main", (await call(rv, "POST", "/api/cms/versions", { branch: "main", message: "x" })).status === 403);

// ───────── Mientras tanto, main sigue su camino ─────────
const pm = `pm-${stamp}`;
await addPages(sa, "main", page(pm));
const mainVersion = await call(sa, "POST", "/api/cms/versions", { branch: "main", message: "Agrego otra página en main", changes: [] });
check("main guarda su propia versión", mainVersion.status === 201, JSON.stringify(mainVersion.data));

// ───────── Pull request ─────────
const opened = await call(rv, "POST", "/api/cms/reviews", { title: "Mi aporte", from: mine, into: "main" });
check("envía una pull request", opened.status === 201 && opened.data.pullRequest.status === "open" && opened.data.pullRequest.changes.length === 1, JSON.stringify(opened.data));
const number = opened.data.pullRequest?.number;
check("la recibe quien lo invitó", opened.data.pullRequest?.reviewerName === "Super Admin" || !!opened.data.pullRequest?.reviewerId, JSON.stringify(opened.data.pullRequest));
check("reenviar no duplica la pull request", (await call(rv, "POST", "/api/cms/reviews", { title: "Mi aporte", from: mine, into: "main" })).data.pullRequest?.number === number);
check("el superadministrador la ve", (await call(sa, "GET", "/api/cms/reviews")).data.pullRequests.some((pr: { number: number }) => pr.number === number));
check("el autor no puede fusionar la suya", (await call(rv, "PATCH", "/api/cms/reviews", { number, decision: "merge" })).status === 403);

const merged = await call(sa, "PATCH", "/api/cms/reviews", { number, decision: "merge" });
check("quien la recibe la fusiona", merged.status === 200 && merged.data.pullRequest.status === "merged" && merged.data.pullRequest.approvals.length === 1, JSON.stringify(merged.data));
const mainAfter = (await call(sa, "GET", "/api/cms/site?branch=main")).data.site;
check("main tiene lo de las dos ramas", pageIds(mainAfter).includes(pv) && pageIds(mainAfter).includes(pm));
const after = (await call(sa, "GET", "/api/cms/versions")).data;
check("la fusión queda como versión en main", after.commits[0].branch === "main" && after.commits[0].message.startsWith(`Merge del PR #${number}`), after.commits[0]?.message);
check("no se puede fusionar dos veces", (await call(sa, "PATCH", "/api/cms/reviews", { number, decision: "merge" })).status === 404);

// ───────── Conflictos ─────────
const pc = `pc-${stamp}`;
await addPages(sa, "main", page(pc, "Nombre en main"));
await addPages(rv, mine, page(pc, "Nombre en la rama"));
await call(rv, "POST", "/api/cms/versions", { branch: mine, message: "Mi versión de la página", changes: [{ node: "Página", property: "Nombre", before: "—", after: "Nombre en la rama" }] });
const second = await call(rv, "POST", "/api/cms/reviews", { title: "Con conflicto", from: mine, into: "main" });
const open = await call(sa, "PATCH", "/api/cms/reviews", { number: second.data.pullRequest.number, decision: "merge" });
check("un conflicto sin resolver impide fusionar y se muestra", open.status === 409 && open.data.conflicts?.length === 1 && open.data.conflicts[0].node === `pages/${pc}`, JSON.stringify(open.data));
check("no se escribió nada a medias", (await call(sa, "GET", "/api/cms/site?branch=main")).data.site.pages.find((item: { id: string }) => item.id === pc).name === "Nombre en main");
const resolved = await call(sa, "PATCH", "/api/cms/reviews", { number: second.data.pullRequest.number, decision: "merge", resolutions: [{ node: open.data.conflicts[0].node, property: open.data.conflicts[0].property, resolution: "from" }] });
check("resuelto, se fusiona con lo elegido", resolved.status === 200 && (await call(sa, "GET", "/api/cms/site?branch=main")).data.site.pages.find((item: { id: string }) => item.id === pc).name === "Nombre en la rama", JSON.stringify(resolved.data));

// ───────── Cerrar y eliminar ramas ─────────
const extra = `extra-${stamp}`;
check("crea una rama nueva", (await call(rv, "POST", "/api/cms/branches", { name: extra, base: mine })).status === 201);
check("la rama nueva parte de lo de su base", pageIds((await call(rv, "GET", `/api/cms/site?branch=${extra}`)).data.site).includes(pv));
check("no se repite el nombre", (await call(rv, "POST", "/api/cms/branches", { name: extra, base: mine })).status === 409);
check("otra persona no la elimina", (await call(sa, "DELETE", `/api/cms/branches?name=${extra}`)).status === 403);
check("su dueño la elimina", (await call(rv, "DELETE", `/api/cms/branches?name=${extra}`)).status === 200 && !(await call(rv, "GET", "/api/cms/versions")).data.branches.some((branch: { name: string }) => branch.name === extra));
check("main no se elimina", (await call(sa, "DELETE", "/api/cms/branches?name=main")).status === 400);

// ───────── Issues ─────────
const listed = (await call(sa, "GET", "/api/cms/versions")).data;
check("hay etiquetas de fábrica y personas asignables", listed.labels.length >= 3 && listed.people.includes("Super Admin"), JSON.stringify(listed.labels));
const title = `Issue ${stamp}`;
check("reporta un issue con etiqueta propia y responsable", (await call(sa, "POST", "/api/cms/issues", { title, label: `Etq-${stamp}`, tone: "warning", assignees: ["Super Admin"] })).status === 201);
const issue = (await call(sa, "GET", "/api/cms/versions")).data.issues.find((item: { title: string }) => item.title === title);
check("el issue queda con su número, etiqueta y responsable", issue?.open === true && issue.label === `Etq-${stamp}` && issue.assignees[0] === "Super Admin", JSON.stringify(issue));
await call(sa, "PATCH", "/api/cms/issues", { number: issue.number, action: "assignee", member: "Super Admin" });
await call(sa, "PATCH", "/api/cms/issues", { number: issue.number, action: "toggle" });
const changed = (await call(sa, "GET", "/api/cms/versions")).data.issues.find((item: { title: string }) => item.title === title);
check("se quita el responsable y se cierra", changed.assignees.length === 0 && changed.open === false, JSON.stringify(changed));

// ───────── Publicar ─────────
const published = await call(sa, "POST", "/api/cms/publish", { branch: "main" });
check("publica la última versión de main", published.status === 201 && published.data.release.branch === "main", JSON.stringify(published.data));
check("publicar lo ya publicado se rechaza", (await call(sa, "POST", "/api/cms/publish", { branch: "main" })).status === 409);
check("quien no publica en main no publica", (await call(rv, "POST", "/api/cms/publish", { branch: mine })).status === 403);
check("la publicación aparece en las publicaciones", (await call(sa, "GET", "/api/cms/versions")).data.releases[0]?.commitId === published.data.release?.commitId);
const siteResponse = await fetch(`${BASE}/api/site`);
const openSite = (await siteResponse.json().catch(() => ({}))) as Loose;
check("el público ve el sitio publicado, sin sesión", siteResponse.status === 200 && Array.isArray(openSite.pages), String(siteResponse.status));

// ───────── Limpieza ─────────
await call(sa, "PUT", "/api/cms/site?branch=main", { pages: { upsert: [], remove: [pv, pm, pc] } });
await call(sa, "POST", "/api/cms/versions", { branch: "main", message: "Estado limpio tras las pruebas", changes: [] });
await call(sa, "DELETE", `/api/auth/users?id=${created.id}`);

console.log(`\n${passed} bien, ${failed} mal`);
process.exit(failed === 0 ? 0 : 1);
