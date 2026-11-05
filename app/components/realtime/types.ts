/** Una persona conectada al mismo proyecto (lo que el servidor de tiempo real cuenta de ella). */
export interface Peer {
  /** Una conexión: la misma persona con dos pestañas abiertas aparece dos veces. */
  id: string;
  uid: string;
  name: string;
  color: string;
  branch: string;
  page: string | null;
  /** Las secciones que tiene seleccionadas. */
  selection: string[];
  /** Dónde tiene el cursor, en píxeles del diseño de esa página. */
  cursor: { x: number; y: number } | null;
}

export type ServerMessage =
  | { type: "hello"; me: Peer; peers: Peer[] }
  | { type: "peer"; peer: Peer }
  | { type: "leave"; id: string }
  | { type: "cursor"; id: string; page: string | null; cursor: Peer["cursor"] }
  | { type: "select"; id: string; page: string | null; ids: string[] }
  | { type: "draft"; id: string; branch: string; patch: unknown };

export type ClientMessage =
  | { type: "join"; branch: string }
  | { type: "cursor"; page: string; x: number; y: number }
  | { type: "select"; page: string; ids: string[] }
  | { type: "draft"; patch: unknown };
