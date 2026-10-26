/** Reglas de negocio puras del control de versiones (sin React ni estado). */

import type { AttributedChange, Branch, Commit, Issue, Label, Member, PullRequest, Release } from "./types";

export const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

/** "Feature Héroe / Nuevo" → "feature-heroe/nuevo" */
export function slugifyBranchName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9/._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function canApprove(pr: PullRequest, user: string): boolean {
  return pr.status === "open" && pr.author !== user && !pr.approvals.includes(user);
}

export const memberNames = (members: Member[]): string[] => members.map((m) => m.name);

/** Miembros que pueden aprobar este PR (todos menos su autor y quienes ya aprobaron). */
export const approversOf = (pr: PullRequest, members: Member[]): string[] =>
  memberNames(members).filter((name) => canApprove(pr, name));

/** Un miembro nuevo necesita nombre y no repetir a otro (sin distinguir mayúsculas). */
export const memberProblem = (members: Member[], input: string): string | null => {
  const name = input.trim();
  if (!name) return "Escribe un nombre o un correo.";
  const taken = members.some((m) => m.name.toLowerCase() === name.toLowerCase());
  return taken ? "Esa persona ya está en el equipo." : null;
};

/** Código estable (hash simple) para el enlace de invitación del prototipo. */
export function inviteToken(seed: string): string {
  let hash = 5381;
  for (const char of seed) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return hash.toString(36).padStart(7, "0");
}

export const inviteLink = (origin: string, token: string): string => `${origin}/?invitacion=${token}`;

/** Motivos por los que un PR abierto todavía no se puede fusionar. Vacío = listo. */
export function mergeBlockers(pr: PullRequest): string[] {
  const blockers: string[] = [];

  const unresolved = pr.conflicts.filter((c) => c.resolution === null).length;
  if (unresolved > 0) {
    blockers.push(`Resuelve ${plural(unresolved, "conflicto", "conflictos")} de merge.`);
  }

  const missing = pr.requiredApprovals - pr.approvals.length;
  if (missing > 0) {
    blockers.push(`Faltan ${plural(missing, "aprobación", "aprobaciones")}.`);
  }

  return blockers;
}

/** La rama principal (sin base) nunca se puede eliminar. */
export const canDeleteBranch = (branch: Branch): boolean => branch.base !== null;

/** Una rama está fusionada si alguno de sus pull requests ya se fusionó. */
export const isBranchMerged = (pullRequests: PullRequest[], name: string): boolean =>
  pullRequests.some((pr) => pr.from === name && pr.status === "merged");

/** Busca una etiqueta ignorando mayúsculas, para no duplicar «Bug» y «bug». */
export const findLabel = (labels: Label[], name: string): Label | undefined =>
  labels.find((label) => label.name.toLowerCase() === name.trim().toLowerCase());

/** Los cambios de una versión, cada uno con su autor, fecha y versión. */
export const attributeChanges = (commit: Commit): AttributedChange[] =>
  commit.changes.map((change) => ({
    ...change,
    author: commit.author,
    at: commit.at,
    commitId: commit.id,
  }));

/**
 * Cambio neto de una rama frente a su base (equivalente a `git diff base...rama`).
 * Si un mismo elemento cambió en varias versiones se muestra del valor original al final,
 * atribuido a la última versión que lo tocó; si terminó igual que al principio no aparece.
 * `commits` viene de más reciente a más antiguo, como en el estado.
 */
export function summarizeChanges(commits: Commit[]): AttributedChange[] {
  const net = new Map<string, AttributedChange>();

  for (const commit of [...commits].reverse()) {
    for (const change of attributeChanges(commit)) {
      const key = `${change.node}\u0000${change.property}`;
      const previous = net.get(key);
      net.set(key, previous ? { ...change, before: previous.before } : change);
    }
  }

  return [...net.values()].filter((change) => change.before !== change.after);
}

export type AssigneeFilter = "all" | "unassigned" | (string & {});

export const matchesAssignee = (issue: Issue, filter: AssigneeFilter): boolean => {
  if (filter === "all") return true;
  if (filter === "unassigned") return issue.assignees.length === 0;
  return issue.assignees.includes(filter);
};

/** Última versión guardada de una rama (los commits vienen del más reciente al más antiguo). */
export const headOf = (commits: Commit[], branch: string): Commit | undefined =>
  commits.find((commit) => commit.branch === branch);

interface PublishContext {
  unsavedCount: number;
  head: Commit | undefined;
  live: Release | undefined;
}

/**
 * Motivos por los que todavía no se puede publicar. Vacío = listo.
 * Solo se publican versiones guardadas: primero hay que hacer un commit.
 */
export function publishBlockers({ unsavedCount, head, live }: PublishContext): string[] {
  const blockers: string[] = [];

  if (unsavedCount > 0) {
    blockers.push(
      `Tienes ${plural(unsavedCount, "cambio", "cambios")} sin guardar. Añádelos y haz una versión antes de publicar.`,
    );
  }
  if (!head) {
    blockers.push("Esta rama todavía no tiene versiones. Haz una versión para poder publicar.");
  } else if (live?.commitId === head.id) {
    blockers.push("La última versión de esta rama ya está publicada.");
  }

  return blockers;
}
