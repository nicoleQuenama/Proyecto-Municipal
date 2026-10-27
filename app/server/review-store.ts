import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { User } from "../components/auth/types";
import { canReview, canSee } from "../components/versioning/group-rules";
import type { AttributedChange, PullRequest } from "../components/versioning/types";
import { findStored } from "./auth-store";

/** Las pull requests de los equipos de trabajo: viven en el servidor para que lleguen de verdad a quien las revisa. */
const DIR = join(process.cwd(), ".cms-data");
const FILE = join(DIR, "reviews.json");
/** Empiezan en un número alto para no chocar con las pull requests anteriores al sistema. */
const FIRST_NUMBER = 101;
const MAX_CHANGES = 300;
const MAX_TEXT = 300;

interface Store {
  next: number;
  items: PullRequest[];
}

async function read(): Promise<Store> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Store;
  } catch {
    return { next: FIRST_NUMBER, items: [] };
  }
}

async function write(store: Store): Promise<void> {
  await mkdir(DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(store, null, 2));
}

const text = (value: unknown): string => (typeof value === "string" ? value.slice(0, MAX_TEXT) : "");

/** Solo se aceptan cambios con la forma esperada y de tamaño razonable. */
function cleanChanges(value: unknown): AttributedChange[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_CHANGES).map((change: Record<string, unknown>) => ({
    node: text(change.node), property: text(change.property), before: text(change.before), after: text(change.after),
    author: text(change.author), at: text(change.at), commitId: text(change.commitId),
  }));
}

export interface NewReview {
  title: unknown;
  from: unknown;
  into: unknown;
  changes: unknown;
}

/** Las que esta persona puede ver: las que envió o las que le toca revisar. */
export async function listFor(user: User): Promise<PullRequest[]> {
  return (await read()).items.filter((pr) => canSee(user, pr)).sort((a, b) => b.number - a.number);
}

/** Registra una pull request. El autor es quien tiene la sesión; la recibe quien lo invitó (o un superadministrador). */
export async function open(user: User, input: NewReview): Promise<PullRequest> {
  const title = text(input.title).trim();
  const from = text(input.from).trim();
  const into = text(input.into).trim();
  if (!title || !from || !into || from === into) throw new Error("Falta el título o las ramas son iguales.");

  const owner = user.invitedBy ? await findStored(user.invitedBy) : null;
  const store = await read();
  if (store.items.some((pr) => pr.status === "open" && pr.authorId === user.id && pr.from === from && pr.into === into)) {
    throw new Error("Ya tienes una pull request abierta entre esas ramas: espera su revisión.");
  }

  const pr: PullRequest = {
    number: store.next, title, from, into, author: user.name, status: "open", approvals: [], requiredApprovals: 1,
    changes: cleanChanges(input.changes), conflicts: [],
    authorId: user.id, reviewerId: owner?.id ?? null, reviewerName: owner?.name ?? "el superadministrador",
  };
  store.next += 1;
  store.items.push(pr);
  await write(store);
  return pr;
}

export type Decision = "merge" | "close";

/** Solo quien la recibe la fusiona (y con eso la aprueba); la puede cerrar él o su autor. */
export async function decide(user: User, number: number, decision: Decision): Promise<PullRequest> {
  const store = await read();
  const pr = store.items.find((item) => item.number === number);
  if (!pr || !canSee(user, pr)) throw new Error("No existe esa pull request.");
  if (pr.status !== "open") throw new Error("Esa pull request ya no está abierta.");

  if (decision === "merge") {
    if (!canReview(user, pr)) throw new Error("Solo quien invitó a esta persona puede revisar y fusionar su pull request.");
    pr.approvals = [user.name];
    pr.status = "merged";
  } else if (canReview(user, pr) || user.id === pr.authorId) {
    pr.status = "closed";
  } else {
    throw new Error("No puedes cerrar esta pull request.");
  }
  await write(store);
  return pr;
}
