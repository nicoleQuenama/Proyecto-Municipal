import type { LocalVersioningState } from "./types";

/** Estado de partida limpio: todo (ramas, versiones, issues, publicaciones) llega del servidor. */
export const INITIAL_STATE: LocalVersioningState = {
  branches: [],
  commits: [],
  pullRequests: [],
  releases: [],
  labels: [],
  issues: [],
  people: [],
};
