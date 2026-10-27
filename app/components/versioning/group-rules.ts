/** Reglas puras de los equipos de trabajo en el control de versiones (las usan el editor y el servidor). */

import type { User } from "../auth/types";
import type { PullRequest } from "./types";

/** ¿Pertenece a un equipo de trabajo? Lo invitó alguien o tiene un acceso asignado. Los superadministradores nunca. */
export const isGroupMember = (user: Pick<User, "role" | "invitedBy" | "access"> | null | undefined): boolean =>
  !!user && user.role !== "superadmin" && (!!user.invitedBy || !!user.access);

/** ¿Debe trabajar en su propia rama y enviar pull requests, en vez de publicar directo en main? */
export const mustUseBranch = (user: Pick<User, "role" | "invitedBy" | "access"> | null | undefined): boolean =>
  isGroupMember(user) && (user?.access?.denied.includes("publishMain") ?? false);

/** El nombre de la rama de trabajo que el sistema crea para esa persona. */
export const defaultBranchOf = (username: string): string => `trabajo-${username.toLowerCase().replace(/[^a-z0-9_-]+/g, "-")}`;

type Reviewable = Pick<PullRequest, "authorId" | "reviewerId">;

/** ¿Recibe esta persona la pull request? Solo su dueño (quien invitó al autor) o, si no tiene dueño, un superadministrador. */
export function canReview(user: Pick<User, "id" | "role"> | null | undefined, pr: Reviewable): boolean {
  if (!user || pr.authorId === undefined || user.id === pr.authorId) return false;
  return pr.reviewerId === null || pr.reviewerId === undefined ? user.role === "superadmin" : user.id === pr.reviewerId;
}

/** ¿Debe ver esta pull request? Quien la envió o quien la recibe; las anteriores al sistema (sin autor) las ve todo el mundo. */
export const canSee = (user: Pick<User, "id" | "role"> | null | undefined, pr: Reviewable): boolean =>
  pr.authorId === undefined || user?.id === pr.authorId || canReview(user, pr);

/** Las pull requests abiertas que esta persona tiene que revisar. */
export const pendingFor = (user: Pick<User, "id" | "role"> | null | undefined, pullRequests: PullRequest[]): PullRequest[] =>
  pullRequests.filter((pr) => pr.status === "open" && canReview(user, pr));
