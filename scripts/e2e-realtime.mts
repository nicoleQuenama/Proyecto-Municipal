/**
 * Prueba de tiempo real contra la app (pnpm dev) y el servidor de WebSockets:
 *   node --env-file=.env.local scripts/e2e-realtime.mts
 * Dos personas entran al mismo proyecto: se ven, se ven los cursores y las selecciones, y lo que una edita le llega a la otra
 * solo si está en la misma rama.
 */
const BASE = process.env.APP_URL ?? "http://localhost:3000";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;
let passed = 0;
let failed = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (ok) passed += 1;
  else failed += 1;
  console.log(`${ok ? "ok   " : "FALLO"} ${label}${ok ? "" : ` ${detail}`}`);
};

async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json", "x-portal-request": "1" }, body: JSON.stringify({ email, password }) });
  if (!response.ok) throw new Error(`login ${email}: ${response.status}`);
  return response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; ");
}

async function ticket(cookie: string): Promise<{ url: string; ticket: string }> {
  const response = await fetch(`${BASE}/api/cms/realtime`, { headers: { "x-portal-request": "1", cookie } });
  return (await response.json()) as { url: string; ticket: string };
}

/** Una conexión que anota todo lo que recibe. */
async function connect(cookie: string) {
  const { url, ticket: boleto } = await ticket(cookie);
  const socket = new WebSocket(`${url}/?ticket=${encodeURIComponent(boleto)}`);
  const received: Loose[] = [];
  socket.onmessage = (event) => received.push(JSON.parse(String(event.data)));
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = () => reject(new Error("no se pudo conectar"));
  });
  return { socket, received, send: (message: unknown) => socket.send(JSON.stringify(message)) };
}
const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const a = await connect(await login("superadmin@portal.dev", "SuperAdmin2026!"));
await wait();
check("al entrar recibe su identidad y su color", a.received[0]?.type === "hello" && !!a.received[0].me.color, JSON.stringify(a.received[0]));

const b = await connect(await login("designer@portal.dev", "Designer2026!"));
await wait();
check("la segunda persona ve a la primera ya conectada", b.received[0].peers.some((peer: Loose) => peer.name === "Super Admin"));
check("la primera ve llegar a la segunda", a.received.some((message) => message.type === "peer" && message.peer.name === "Diseñador"));
check("cada quien tiene su propio color", a.received[0].me.color !== b.received[0].me.color);

a.send({ type: "cursor", page: "inicio", x: 120.5, y: 40 });
a.send({ type: "select", page: "inicio", ids: ["blk1", "blk2"] });
await wait();
check("el cursor llega a la otra persona", b.received.some((message) => message.type === "cursor" && message.page === "inicio" && message.cursor.x === 120.5));
check("la selección llega a la otra persona", b.received.some((message) => message.type === "select" && message.ids.length === 2));
check("quien lo envía no lo recibe de vuelta", !a.received.some((message) => message.type === "cursor"));

a.send({ type: "join", branch: "rama-x" });
await wait();
a.send({ type: "draft", patch: { globalCss: "a{}" } });
await wait();
check("lo editado en otra rama no le llega a quien está en main", !b.received.some((message) => message.type === "draft"));
b.send({ type: "join", branch: "rama-x" });
await wait();
a.send({ type: "draft", patch: { globalCss: "b{}" } });
await wait();
check("lo editado en la misma rama sí llega, con su autor", b.received.some((message) => message.type === "draft" && message.patch.globalCss === "b{}" && message.branch === "rama-x"));

a.send({ type: "cursor", page: "inicio", x: "mal", y: 1 });
await wait();
check("un cursor con datos inválidos se descarta sin romper nada", b.received.filter((message) => message.type === "cursor").at(-1)?.cursor === null);

a.socket.close();
await wait();
check("al salir, la otra persona lo sabe", b.received.some((message) => message.type === "leave"));

const intruder = new WebSocket(`ws://localhost:3001/?ticket=falso.falso`);
const refused = await new Promise<boolean>((resolve) => {
  intruder.onopen = () => resolve(false);
  intruder.onerror = () => resolve(true);
  intruder.onclose = () => resolve(true);
});
check("un boleto falso no entra", refused);

b.socket.close();
console.log(`\n${passed} bien, ${failed} mal`);
process.exit(failed === 0 ? 0 : 1);
