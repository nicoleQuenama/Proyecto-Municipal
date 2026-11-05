/**
 * Prueba de varias instancias del tiempo real con Redis (contra la app en pnpm dev:web y un Redis):
 *   REDIS_URL=redis://127.0.0.1:6379 node --env-file=.env.local scripts/e2e-realtime-cluster.mts
 * Levanta tres instancias propias (puertos 3101-3103) y comprueba que la gente conectada a una se ve, se ve su cursor y lo que
 * edita desde las otras, que quien llega tarde ve a quienes ya estaban, y que las personas de una instancia caída dejan de contar.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { createClient } from "redis";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) throw new Error("Falta REDIS_URL.");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;
let passed = 0;
let failed = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (ok) passed += 1;
  else failed += 1;
  console.log(`${ok ? "ok   " : "FALLO"} ${label}${ok ? "" : ` ${detail}`}`);
};
const wait = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const instances: { port: number; process: ChildProcess; id: string }[] = [];
async function startInstance(port: number) {
  const child = spawn(process.execPath, ["--env-file=.env.local", "realtime/server.mts"], { env: { ...process.env, REDIS_URL, REALTIME_PORT: String(port) }, stdio: ["ignore", "pipe", "inherit"] });
  const id = await new Promise<string>((resolve) => child.stdout!.on("data", (data) => /instancia (\w+)/.exec(String(data)) && resolve(/instancia (\w+)/.exec(String(data))![1])));
  instances.push({ port, process: child, id });
  return { port, id, child };
}

async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json", "x-portal-request": "1" }, body: JSON.stringify({ email, password }) });
  return response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; ");
}

async function connect(cookie: string, port: number) {
  const { ticket } = (await (await fetch(`${BASE}/api/cms/realtime`, { headers: { "x-portal-request": "1", cookie } })).json()) as { ticket: string };
  const socket = new WebSocket(`ws://localhost:${port}/?ticket=${encodeURIComponent(ticket)}`);
  const received: Loose[] = [];
  socket.onmessage = (event) => received.push(JSON.parse(String(event.data)));
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = () => reject(new Error(`no se pudo conectar al ${port}`));
  });
  await wait(250);
  return { socket, received, send: (message: unknown) => socket.send(JSON.stringify(message)) };
}

const [one, two, three] = [await startInstance(3101), await startInstance(3102), await startInstance(3103)];
const admin = await login("superadmin@portal.dev", "SuperAdmin2026!");
const designer = await login("designer@portal.dev", "Designer2026!");

try {
  const a = await connect(admin, one.port);
  const b = await connect(designer, two.port);
  check("quien entra en otra instancia ve a quien ya estaba", b.received[0].peers.some((peer: Loose) => peer.name === "Super Admin"), JSON.stringify(b.received[0]));
  check("y la primera lo ve llegar", a.received.some((m) => m.type === "peer" && m.peer.name === "Diseñador"));
  check("los ids no se repiten entre instancias", a.received[0].me.id !== b.received[0].me.id && a.received[0].me.id.startsWith(one.id));
  check("cada quien recibe su propio color aunque estén en instancias distintas", a.received[0].me.color !== b.received[0].me.color);

  a.send({ type: "cursor", page: "inicio", x: 10, y: 20 });
  a.send({ type: "select", page: "inicio", ids: ["blk1"] });
  await wait();
  check("el cursor cruza de una instancia a otra", b.received.some((m) => m.type === "cursor" && m.cursor?.x === 10));
  check("la selección también", b.received.some((m) => m.type === "select" && m.ids[0] === "blk1"));

  a.send({ type: "join", branch: "rama-z" });
  await wait();
  a.send({ type: "draft", patch: { globalCss: "a{}" } });
  await wait();
  check("lo editado en otra rama no cruza", !b.received.some((m) => m.type === "draft"));
  b.send({ type: "join", branch: "rama-z" });
  await wait();
  a.send({ type: "draft", patch: { globalCss: "b{}" } });
  await wait();
  check("lo editado en la misma rama sí cruza", b.received.some((m) => m.type === "draft" && m.patch.globalCss === "b{}"));

  const c = await connect(admin, three.port);
  const seen = c.received[0].peers.map((peer: Loose) => `${peer.name}:${peer.branch}`);
  check("quien llega tarde ve a todos, con su rama y selección al día", seen.includes("Super Admin:rama-z") && seen.includes("Diseñador:rama-z"), JSON.stringify(seen));
  check("y con lo que tienen seleccionado", c.received[0].peers.find((peer: Loose) => peer.name === "Super Admin")?.selection?.[0] === "blk1");

  b.socket.close();
  await wait();
  check("quien se va de una instancia desaparece en las demás", a.received.some((m) => m.type === "leave" && m.id.startsWith(two.id)) && c.received.some((m) => m.type === "leave"));

  // Una instancia que se cae sin despedirse: sus personas siguen en Redis hasta que caduca su latido.
  const doomed = await connect(designer, three.port);
  c.socket.close();
  a.socket.close();
  await wait();
  three.child.kill("SIGKILL");
  await wait(500);
  const redis = createClient({ url: REDIS_URL });
  await redis.connect();
  await redis.del(`rt:inst:${three.id}`); // lo que pasa solo a los 45 s sin latido
  const late = await connect(admin, one.port);
  check("las personas de una instancia caída dejan de contar", !late.received[0].peers.some((peer: Loose) => peer.id.startsWith(three.id)), JSON.stringify(late.received[0].peers));
  check("y su rastro se limpia de Redis", Object.keys(await redis.hGetAll(`rt:peers:${[...(await redis.keys("rt:peers:*"))][0].replace("rt:peers:", "")}`)).every((id) => !id.startsWith(three.id)));
  await redis.quit();
  late.socket.close();
  void doomed;
} finally {
  for (const instance of instances) instance.process.kill();
}
console.log(`\n${passed} bien, ${failed} mal`);
process.exit(failed === 0 ? 0 : 1);
