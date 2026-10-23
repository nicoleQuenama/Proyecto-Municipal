import type { ExternalState, Manifest } from "./types";

/** Lo que se publica de lo que hay en el editor. */
export function buildManifest(state: ExternalState): Omit<Manifest, "publishedAt"> | null {
  if (!state.site) return null;
  return {
    version: 1,
    site: state.site,
    autoResponsive: state.autoResponsive,
    patches: state.patches,
    pages: state.pages,
  };
}
