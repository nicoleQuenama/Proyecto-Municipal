import { REQUEST_HEADER } from "../../server/request-header";
import type { AttributedChange, PullRequest } from "./types";

const HEADERS = { "content-type": "application/json", [REQUEST_HEADER]: "1" };

async function call<T>(init?: RequestInit): Promise<T> {
  const response = await fetch("/api/cms/reviews", { ...init, headers: HEADERS });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "No se pudo completar la operación.");
  return data;
}

/** Las pull requests de equipo que esta persona envió o tiene que revisar. */
export const fetchReviews = async (): Promise<PullRequest[]> => (await call<{ pullRequests: PullRequest[] }>()).pullRequests;

export const sendReview = (input: { title: string; from: string; into: string; changes: AttributedChange[] }) =>
  call<{ pullRequest: PullRequest }>({ method: "POST", body: JSON.stringify(input) });

export const decideReview = (number: number, decision: "merge" | "close") =>
  call<{ pullRequest: PullRequest }>({ method: "PATCH", body: JSON.stringify({ number, decision }) });
