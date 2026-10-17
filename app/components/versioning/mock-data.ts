import type { Commit, VersioningState } from "./types";
import { summarizeChanges } from "./versioning-rules";

/** Datos de ejemplo para el prototipo visual. Se reemplazan por datos reales más adelante. */

const COMMITS: Commit[] = [
  {
    id: "c6",
    branch: "main",
    message: "Ajusta el tamaño del titular a 52px",
    author: "Luis",
    at: "2026-10-15T16:40:00",
    changes: [{ node: "Titular", property: "Tamaño", before: "48px", after: "52px" }],
  },
  {
    id: "c5",
    branch: "main",
    message: "Estructura inicial de la portada",
    author: "Ana",
    at: "2026-10-13T10:05:00",
    changes: [],
  },
  {
    id: "c4",
    branch: "feature/hero-cta",
    message: "Agrega botón CTA al hero",
    author: "Ana",
    at: "2026-10-16T11:30:00",
    changes: [{ node: "Hero · Botón", property: "Texto", before: "—", after: "Solicitar trámite" }],
  },
  {
    id: "c3",
    branch: "feature/hero-cta",
    message: "Titular más grande y azul",
    author: "Ana",
    at: "2026-10-16T08:50:00",
    changes: [
      { node: "Titular", property: "Tamaño", before: "48px", after: "56px" },
      { node: "Titular", property: "Color", before: "#171717", after: "#0d99ff" },
    ],
  },
  {
    id: "c2",
    branch: "feature/hero-cta",
    message: "Nuevo fondo del hero",
    author: "Ana",
    at: "2026-10-15T18:20:00",
    changes: [{ node: "Hero", property: "Fondo", before: "Blanco", after: "Gris claro" }],
  },
  {
    id: "c1",
    branch: "fix/footer-spacing",
    message: "Más espacio en el pie de página",
    author: "Luis",
    at: "2026-10-16T10:15:00",
    changes: [{ node: "Pie de página", property: "Relleno", before: "16px", after: "32px" }],
  },
];

const changesOf = (branch: string) =>
  summarizeChanges(COMMITS.filter((c) => c.branch === branch));

export const INITIAL_STATE: VersioningState = {
  current: "main",
  branches: [
    { name: "main", author: "Ana", base: null },
    { name: "feature/hero-cta", author: "Ana", base: "main" },
    { name: "fix/footer-spacing", author: "Luis", base: "main" },
  ],
  commits: COMMITS,
  pullRequests: [
    {
      number: 1,
      title: "Nuevo hero con botón CTA",
      from: "feature/hero-cta",
      into: "main",
      author: "Ana",
      status: "open",
      approvals: ["Luis"],
      requiredApprovals: 2,
      changes: changesOf("feature/hero-cta"),
      conflicts: [
        {
          node: "Titular",
          property: "Tamaño",
          base: "48px",
          into: "52px",
          from: "56px",
          resolution: null,
        },
      ],
    },
    {
      number: 2,
      title: "Más espacio en el pie de página",
      from: "fix/footer-spacing",
      into: "main",
      author: "Luis",
      status: "open",
      approvals: [],
      requiredApprovals: 1,
      changes: changesOf("fix/footer-spacing"),
      conflicts: [],
    },
  ],
  members: ["Tú", "Ana", "Luis", "Marta"],
  // El baseline real se toma del diseño al iniciar (ver VersioningProvider).
  baseline: {},
  staged: [],
  releases: [
    {
      id: "r1",
      commitId: "c5",
      branch: "main",
      message: "Estructura inicial de la portada",
      author: "Ana",
      at: "2026-10-13T12:00:00",
    },
  ],
  labels: [
    { name: "Bug", tone: "danger" },
    { name: "Diseño", tone: "accent" },
    { name: "Mejora", tone: "success" },
  ],
  issues: [
    { number: 1, title: "El botón CTA no contrasta bien en móvil", label: "Bug", author: "Luis", assignees: ["Ana"], open: true },
    { number: 2, title: "Probar una paleta alternativa para el hero", label: "Diseño", author: "Ana", assignees: [], open: true },
    { number: 3, title: "Alinear los iconos de las tarjetas", label: "Mejora", author: "Tú", assignees: ["Tú", "Luis"], open: false },
  ],
};
