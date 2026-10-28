export const CURRENT_USER = "Tú";

export type MemberRole = "Editor" | "Revisor";

/** Persona del equipo: nombre o correo y lo que puede hacer. */
export interface Member {
  name: string;
  role: MemberRole;
}

export interface Branch {
  name: string;
  author: string;
  /** Rama desde la que se creó; null para la rama principal. */
  base: string | null;
}

/** Una diferencia concreta en un elemento del diseño (un nodo y una propiedad). */
export interface Change {
  node: string;
  property: string;
  before: string;
  after: string;
}

/** Valor de una propiedad del diseño en un momento dado (p. ej. Titular · Tamaño = 48px). */
export interface SnapshotEntry {
  node: string;
  property: string;
  value: string;
}

/** Foto del diseño: propiedades indexadas por una clave estable. */
export type DesignSnapshot = Record<string, SnapshotEntry>;

/** Cambio sin guardar: lo que difiere entre el diseño actual y la última versión guardada. */
export interface WorkingChange extends Change {
  key: string;
  /** Valor actual de la propiedad; null si ya no existe (p. ej. se quitó una imagen). */
  current: SnapshotEntry | null;
}

export interface Release {
  id: string;
  commitId: string;
  branch: string;
  message: string;
  author: string;
  /** Fecha y hora en formato ISO. */
  at: string;
}

/** Quién hizo un cambio, cuándo y en qué versión (commit). */
export interface Attribution {
  author: string;
  /** Fecha y hora en formato ISO. */
  at: string;
  commitId: string;
}

export type AttributedChange = Change & Attribution;

export interface Commit {
  id: string;
  branch: string;
  message: string;
  author: string;
  /** Fecha y hora en formato ISO. */
  at: string;
  changes: Change[];
}

/** Mismo nodo y misma propiedad modificados en las dos ramas. */
export interface Conflict {
  node: string;
  property: string;
  base: string;
  into: string;
  from: string;
  resolution: "into" | "from" | null;
}

export type PullRequestStatus = "open" | "merged" | "closed";

export interface PullRequest {
  number: number;
  title: string;
  from: string;
  into: string;
  author: string;
  status: PullRequestStatus;
  approvals: string[];
  requiredApprovals: number;
  changes: AttributedChange[];
  conflicts: Conflict[];
  /** Solo en las que llegan por el servidor (equipos de trabajo): quién la envió y quién la revisa. */
  authorId?: string;
  /** Quien invitó al autor y es el único que la recibe; `null` si la recibe un superadministrador. */
  reviewerId?: string | null;
  reviewerName?: string;
}

export type LabelTone = "neutral" | "accent" | "success" | "danger" | "warning";

/** Etiqueta de issue. Las de fábrica y las personalizadas comparten la misma forma. */
export interface Label {
  name: string;
  tone: LabelTone;
}

export interface Issue {
  number: number;
  title: string;
  /** Nombre de una etiqueta registrada en `VersioningState.labels`. */
  label: string;
  author: string;
  /** Miembros del equipo a cargo del issue (puede haber varios o ninguno). */
  assignees: string[];
  open: boolean;
}

export interface VersioningState {
  branches: Branch[];
  current: string;
  /** De más reciente a más antiguo. */
  commits: Commit[];
  pullRequests: PullRequest[];
  issues: Issue[];
  labels: Label[];
  members: Member[];
  /** Diseño tal como quedó en la última versión guardada. */
  baseline: DesignSnapshot;
  /** Claves de los cambios añadidos para la próxima versión (el «git add»). */
  staged: string[];
  /** Publicaciones a la página oficial, de más reciente a más antigua. */
  releases: Release[];
}

export type VersioningAction =
  | { type: "project/load"; state: VersioningState }
  /** Borra las versiones y publicaciones guardadas y toma el diseño de ahora como punto de partida. */
  | { type: "history/reset"; baseline: DesignSnapshot }
  | { type: "branch/create"; name: string; author?: string }
  | { type: "branch/switch"; name: string }
  | { type: "branch/delete"; name: string }
  | { type: "stage/toggle"; key: string }
  | { type: "stage/set"; keys: string[] }
  | { type: "commit"; message: string; changes: WorkingChange[]; at: string; author?: string }
  | { type: "publish"; at: string; author?: string }
  | { type: "pr/open"; title: string; from: string; into: string; author?: string }
  /** Las pull requests que el servidor entrega a esta persona (enviadas por ella o para que las revise). */
  | { type: "reviews/sync"; pullRequests: PullRequest[] }
  /** Una pull request del servidor se fusionó: queda su versión de fusión en la rama de destino. */
  | { type: "review/merged"; number: number; at: string }
  | { type: "pr/approve"; number: number; by?: string }
  | { type: "pr/resolve"; number: number; index: number; resolution: "into" | "from" }
  | { type: "pr/merge"; number: number; at: string }
  | { type: "pr/close"; number: number }
  | { type: "issue/create"; title: string; label: Label; assignees: string[] }
  | { type: "issue/toggle"; number: number }
  | { type: "issue/toggle-assignee"; number: number; member: string }
  | { type: "member/add"; name: string; role: MemberRole }
  | { type: "member/remove"; name: string };
