import { REQUEST_HEADER } from "../../server/request-header";
import type { VersionsPayload } from "../../server/versions/versions-state";
import type { Branch, Change, Commit, Conflict, PullRequest, Release } from "./types";

const HEADERS = { "content-type": "application/json", [REQUEST_HEADER]: "1" };

/** Un rechazo del servidor, con su código y lo que haya traído (p. ej. los conflictos de una fusión). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly data: { conflicts?: Conflict[] },
  ) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: HEADERS });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string; conflicts?: Conflict[] };
  if (!response.ok) throw new ApiError(data.error ?? "No se pudo completar la operación.", response.status, { conflicts: data.conflicts });
  return data;
}

const send = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });

/** Ramas, versiones y pull requests del proyecto, y la rama en la que esta persona debe trabajar. */
export const fetchVersions = () => call<VersionsPayload>("/api/cms/versions");

export const saveVersionApi = (input: { branch: string; message: string; changes: Change[] }) => call<{ commit: Commit }>("/api/cms/versions", send("POST", input));

export const createBranchApi = (name: string, base: string) => call<{ branch: Branch }>("/api/cms/branches", send("POST", { name, base }));

export const deleteBranchApi = (name: string) => call<{ deleted: string }>(`/api/cms/branches?name=${encodeURIComponent(name)}`, { method: "DELETE" });

export const publishApi = (branch: string) => call<{ release: Release }>("/api/cms/publish", send("POST", { branch }));

export const createIssueApi = (input: { title: string; label: string; tone: string; assignees: string[] }) => call<{ ok: true }>("/api/cms/issues", send("POST", input));

export const toggleIssueApi = (number: number) => call<{ ok: true }>("/api/cms/issues", send("PATCH", { number, action: "toggle" }));

export const toggleAssigneeApi = (number: number, member: string) => call<{ ok: true }>("/api/cms/issues", send("PATCH", { number, action: "assignee", member }));

export const sendReview = (input: { title: string; from: string; into: string }) => call<{ pullRequest: PullRequest }>("/api/cms/reviews", send("POST", input));

export const mergeReviewApi = (number: number, resolutions: { node: string; property: string; resolution: "into" | "from" }[]) =>
  call<{ pullRequest: PullRequest }>("/api/cms/reviews", send("PATCH", { number, decision: "merge", resolutions }));

export const closeReviewApi = (number: number) => call<{ pullRequest: PullRequest }>("/api/cms/reviews", send("PATCH", { number, decision: "close" }));
