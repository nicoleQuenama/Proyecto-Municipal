import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** El origen de la página (`http://localhost:3000`); vacío en el servidor, donde no hay `window`. */
export function useOrigin(): string {
  return useSyncExternalStore(noop, () => window.location.origin, () => "");
}
