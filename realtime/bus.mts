/**
 * Cómo se hablan entre sí las instancias del servidor de tiempo real. Con una sola no hace falta nada (`memoryBus`); con varias
 * (`REDIS_URL`) comparten por Redis: lo que ocurre en una sala llega a las personas conectadas a cualquier instancia, y quien
 * entra ve a quienes ya estaban en otras.
 */
import { randomBytes } from "node:crypto";
import { createClient, type RedisClientType } from "redis";

/** Lo que se cuenta de una persona al resto (nunca el socket ni sus permisos). */
export interface PeerView {
  id: string;
  uid: string;
  name: string;
  color: string;
  branch: string;
  page: string | null;
  selection: string[];
  cursor: { x: number; y: number } | null;
}

/** Un mensaje para las demás personas de una sala; `branch` lo limita a quienes miran esa rama. */
export interface Envelope {
  origin: string;
  message: unknown;
  branch?: string;
}

export interface Bus {
  /** Quién soy entre las instancias (los ids de las conexiones lo llevan, para que no se repitan). */
  readonly instance: string;
  /** Empieza a oír una sala (la primera persona que entra en esta instancia) y avisa con quién recibirla. */
  join: (room: string, onEnvelope: (envelope: Envelope) => void) => Promise<void>;
  /** Deja de oírla (se fue la última persona de esta instancia). */
  leave: (room: string) => Promise<void>;
  publish: (room: string, envelope: Omit<Envelope, "origin">) => void;
  /** Anota el estado de una persona para quien llegue después a otra instancia (o lo quita con `null`). */
  remember: (room: string, peerId: string, peer: PeerView | null) => void;
  /** Las personas conectadas a OTRAS instancias, sin las de instancias caídas. */
  others: (room: string) => Promise<PeerView[]>;
  close: () => Promise<void>;
}

const instanceId = () => randomBytes(3).toString("hex");

export const memoryBus = (): Bus => ({
  instance: instanceId(),
  join: async () => undefined,
  leave: async () => undefined,
  publish: () => undefined,
  remember: () => undefined,
  others: async () => [],
  close: async () => undefined,
});

const BEAT_MS = 15_000;
/** Una instancia que no late en este tiempo se da por caída y sus personas dejan de contar. */
const ALIVE_SECONDS = 45;
const ROOM_TTL_SECONDS = 24 * 3600;

export async function redisBus(url: string): Promise<Bus> {
  const instance = instanceId();
  const pub: RedisClientType = createClient({ url });
  const sub: RedisClientType = pub.duplicate();
  for (const client of [pub, sub]) client.on("error", (error) => console.error("[tiempo real] Redis:", error.message));
  await Promise.all([pub.connect(), sub.connect()]);

  const beat = () => void pub.set(`rt:inst:${instance}`, "1", { EX: ALIVE_SECONDS }).catch(() => undefined);
  beat();
  const timer = setInterval(beat, BEAT_MS);
  timer.unref();

  const channel = (room: string) => `rt:room:${room}`;
  const hash = (room: string) => `rt:peers:${room}`;

  return {
    instance,
    join: (room, onEnvelope) => sub.subscribe(channel(room), (raw) => {
      const envelope = JSON.parse(raw) as Envelope;
      if (envelope.origin !== instance) onEnvelope(envelope);
    }),
    leave: async (room) => void (await sub.unsubscribe(channel(room))),
    publish: (room, envelope) => void pub.publish(channel(room), JSON.stringify({ ...envelope, origin: instance })).catch(() => undefined),
    remember: (room, peerId, peer) => {
      const work = peer
        ? pub.multi().hSet(hash(room), peerId, JSON.stringify({ ...peer, inst: instance })).expire(hash(room), ROOM_TTL_SECONDS).exec()
        : pub.hDel(hash(room), peerId);
      void work.catch(() => undefined);
    },
    others: async (room) => {
      const stored = await pub.hGetAll(hash(room)).catch(() => ({}) as Record<string, string>);
      const entries = Object.values(stored).map((raw) => JSON.parse(raw) as PeerView & { inst: string }).filter((entry) => entry.inst !== instance);
      const instances = [...new Set(entries.map((entry) => entry.inst))];
      const alive = new Set((await Promise.all(instances.map(async (inst) => ((await pub.exists(`rt:inst:${inst}`).catch(() => 0)) ? inst : null)))).filter((inst): inst is string => inst !== null));
      // Lo que dejó una instancia caída se borra: nadie más lo va a limpiar.
      const stale = entries.filter((entry) => !alive.has(entry.inst));
      if (stale.length > 0) void pub.hDel(hash(room), stale.map((entry) => entry.id)).catch(() => undefined);
      return entries.filter((entry) => alive.has(entry.inst)).map(({ inst, ...peer }) => (void inst, peer));
    },
    close: async () => {
      clearInterval(timer);
      await pub.del(`rt:inst:${instance}`).catch(() => undefined);
      await Promise.all([pub.quit(), sub.quit()]).catch(() => undefined);
    },
  };
}
