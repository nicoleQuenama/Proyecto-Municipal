/**
 * Servidor de tiempo real (WebSockets): quién está en vivo, sus cursores, lo que seleccionan y lo que mueven.
 *   node --env-file-if-exists=.env.local realtime/server.mts      (lo arranca `pnpm dev` / `pnpm start`)
 *
 * No guarda nada: lo que se edita se guarda por la API de siempre (con sus permisos). Esto solo retransmite, por proyecto,
 * entre quienes están conectados. La identidad llega en un BOLETO firmado por la app web (`/api/cms/realtime`), válido un
 * minuto. Con `REDIS_URL` pueden correr varias instancias (detrás de un balanceador): las salas se comparten por Redis.
 */
import { createServer } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { memoryBus, redisBus, type Bus, type Envelope, type PeerView, type StoredPeer } from "./bus.mts";
import { readTicket, type Ticket } from "./ticket.mts";
import { shouldDeliver, type Audience } from "./units.mts";

const PORT = Number(process.env.REALTIME_PORT ?? 3001);
const MAX_PAYLOAD = 2_000_000;
const MAX_PER_SECOND = 120;
const PALETTE = ["#0d99ff", "#14ae5c", "#f5a623", "#f24822", "#9747ff", "#00b8a9", "#ec4899", "#8b5cf6"];

const bus: Bus = process.env.REDIS_URL ? await redisBus(process.env.REDIS_URL) : memoryBus();

/** Una persona conectada a ESTA instancia. */
interface Peer extends PeerView, Audience {
  canEdit: boolean;
  room: string;
  socket: WebSocket;
  alive: boolean;
  windowStart: number;
  windowCount: number;
}

const rooms = new Map<string, Set<Peer>>();
let counter = 0;

const publicView = ({ id, uid, name, color, branch, page, selection, cursor }: Peer): PeerView => ({ id, uid, name, color, branch, page, selection, cursor });
/** Lo que se recuerda entre instancias: lo mismo más sus unidades (nunca se envía al navegador). */
const storedView = (peer: Peer): StoredPeer => ({ ...publicView(peer), units: peer.units, all: peer.all });
const audienceOf = ({ units, all }: Audience): Audience => ({ units, all });

const send = (peer: Peer, message: unknown) => {
  if (peer.socket.readyState === peer.socket.OPEN) peer.socket.send(JSON.stringify(message));
};

/** Entrega a quienes están conectados a esta instancia: todos menos `except`, los de esa rama si se indica, y solo quienes comparten unidad con `from`. */
function deliver(room: string, message: unknown, from: Audience, except?: Peer, branch?: string) {
  for (const other of rooms.get(room) ?? []) if (other !== except && (!branch || other.branch === branch) && shouldDeliver(from, other)) send(other, message);
}

/** A los demás de la sala, estén en esta instancia o en otra. */
function broadcast(peer: Peer, message: unknown, branch?: string) {
  deliver(peer.room, message, peer, peer, branch);
  bus.publish(peer.room, { message, branch, audience: audienceOf(peer) });
}

/** Lo que otra instancia contó llega a las personas de ésta. */
const fromOtherInstance = (room: string) => (envelope: Envelope) => deliver(room, envelope.message, envelope.audience, undefined, envelope.branch);

const isText = (value: unknown, max: number): value is string => typeof value === "string" && value.length <= max;
const isCoordinate = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && Math.abs(value) < 1_000_000;

function handle(peer: Peer, raw: string) {
  let message: Record<string, unknown>;
  try {
    message = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return;
  }
  switch (message.type) {
    case "join":
      if (isText(message.branch, 100)) {
        peer.branch = message.branch;
        bus.remember(peer.room, peer.id, storedView(peer));
        broadcast(peer, { type: "peer", peer: publicView(peer) });
      }
      return;
    case "cursor":
      peer.cursor = isCoordinate(message.x) && isCoordinate(message.y) && isText(message.page, 100) ? { x: message.x, y: message.y } : null;
      peer.page = isText(message.page, 100) ? message.page : peer.page;
      broadcast(peer, { type: "cursor", id: peer.id, page: peer.page, cursor: peer.cursor });
      return;
    case "select": {
      peer.selection = Array.isArray(message.ids) ? message.ids.filter((id): id is string => isText(id, 100)).slice(0, 50) : [];
      peer.page = isText(message.page, 100) ? message.page : peer.page;
      bus.remember(peer.room, peer.id, storedView(peer));
      broadcast(peer, { type: "select", id: peer.id, page: peer.page, ids: peer.selection });
      return;
    }
    case "draft":
      // Lo que se edita se retransmite al instante a quien mira la misma rama; solo lo envía quien puede editar.
      if (peer.canEdit && typeof message.patch === "object" && message.patch !== null) broadcast(peer, { type: "draft", id: peer.id, branch: peer.branch, patch: message.patch }, peer.branch);
      return;
    default:
  }
}

const server = createServer((request, response) => {
  if (request.url === "/health") return void response.writeHead(200).end("ok");
  response.writeHead(404).end();
});
const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD });

server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url ?? "/", "http://realtime");
  const ticket = readTicket(url.searchParams.get("ticket") ?? "");
  // El origen debe ser el mismo equipo que sirve la app (el puerto cambia, el nombre no).
  const origin = request.headers.origin;
  const sameHost = !origin || new URL(origin).hostname === (request.headers.host ?? "").split(":")[0];
  if (!ticket || !sameHost) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    return void socket.destroy();
  }
  wss.handleUpgrade(request, socket, head, (ws) => void connect(ws, ticket));
});

async function connect(socket: WebSocket, ticket: Ticket) {
  const room = `${ticket.org}:${ticket.project}`;
  const members = rooms.get(room) ?? new Set<Peer>();
  if (members.size === 0) {
    rooms.set(room, members);
    await bus.join(room, fromOtherInstance(room));
  }
  const elsewhere = await bus.others(room);
  const used = new Set([...members, ...elsewhere].map((member) => member.color));
  const peer: Peer = {
    id: `${bus.instance}-${++counter}`,
    uid: ticket.uid,
    name: ticket.name,
    color: PALETTE.find((color) => !used.has(color)) ?? PALETTE[counter % PALETTE.length],
    canEdit: ticket.canEdit,
    units: ticket.units,
    all: ticket.all,
    room,
    branch: "main",
    page: null,
    selection: [],
    cursor: null,
    socket,
    alive: true,
    windowStart: Date.now(),
    windowCount: 0,
  };
  members.add(peer);
  bus.remember(room, peer.id, storedView(peer));

  // A quien entra solo se le cuenta quién está conectado de las unidades que comparte; lo que se recuerda de los demás lleva sus unidades.
  const sees = (other: Audience) => shouldDeliver(other, peer);
  const here = [...members].filter((member) => member !== peer && sees(member)).map(publicView);
  const remote = elsewhere.filter(sees).map(({ units, all, ...view }) => (void units, void all, view));
  send(peer, { type: "hello", me: publicView(peer), peers: [...here, ...remote] });
  broadcast(peer, { type: "peer", peer: publicView(peer) });

  socket.on("pong", () => void (peer.alive = true));
  socket.on("message", (data) => {
    const now = Date.now();
    if (now - peer.windowStart > 1000) [peer.windowStart, peer.windowCount] = [now, 0];
    if (++peer.windowCount > MAX_PER_SECOND) return;
    handle(peer, data.toString());
  });
  socket.on("close", () => {
    members.delete(peer);
    bus.remember(room, peer.id, null);
    broadcast(peer, { type: "leave", id: peer.id });
    if (members.size === 0) {
      rooms.delete(room);
      void bus.leave(room);
    }
  });
  socket.on("error", () => socket.terminate());
}

// Quien deja de contestar (cerró la tapa, se cayó la red) se quita de la sala.
setInterval(() => {
  for (const members of rooms.values()) {
    for (const peer of members) {
      if (!peer.alive) peer.socket.terminate();
      else {
        peer.alive = false;
        peer.socket.ping();
      }
    }
  }
}, 20_000).unref();

// Al apagarse, se despide de las demás instancias: su gente deja de contar de inmediato, sin esperar a que caduque.
async function shutdown() {
  for (const members of rooms.values()) for (const peer of members) peer.socket.terminate();
  await bus.close();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

server.listen(PORT, () => console.log(`[tiempo real] puerto ${PORT} · instancia ${bus.instance} · ${process.env.REDIS_URL ? "varias instancias (Redis)" : "una sola instancia"}`));
