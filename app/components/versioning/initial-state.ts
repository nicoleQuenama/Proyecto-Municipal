import { CURRENT_USER, type VersioningState } from "./types";

/** Estado de partida limpio: una rama «main», sin historial y solo la persona actual en el equipo. */
export const INITIAL_STATE: VersioningState = {
  current: "main",
  branches: [{ name: "main", author: CURRENT_USER, base: null }],
  commits: [],
  pullRequests: [],
  members: [{ name: CURRENT_USER, role: "Editor" }],
  // El baseline real se toma del diseño al iniciar (ver VersioningProvider).
  baseline: {},
  staged: [],
  releases: [],
  labels: [
    { name: "Bug", tone: "danger" },
    { name: "Diseño", tone: "accent" },
    { name: "Mejora", tone: "success" },
  ],
  issues: [],
};
