/** Las clases de cambio por las que se puede filtrar, según de dónde viene su clave. Una nueva es una entrada nueva. */
export const CHANGE_KINDS = [
  { id: "external", label: "Web existente", test: (key: string) => key.startsWith("external:") },
  { id: "design", label: "Estilos", test: (key: string) => /^(var|rule):/.test(key) },
  { id: "navigation", label: "Navegación", test: (key: string) => /^(nav|link):/.test(key) },
  { id: "responsive", label: "Responsive", test: (key: string) => key.startsWith("responsive:") },
  { id: "content", label: "Contenido", test: () => true },
] as const;

export type ChangeKindId = (typeof CHANGE_KINDS)[number]["id"];

/** La primera clase cuya prueba se cumple; «Contenido» recoge el resto. */
export const kindOfKey = (key: string): ChangeKindId => CHANGE_KINDS.find((kind) => kind.test(key))!.id;
