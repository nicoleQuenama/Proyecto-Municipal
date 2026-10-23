import { applyPatches } from "./apply-patches";
import { showAddedPage } from "./show-added-page";
import type { AddedPage, Manifest, Patch } from "./types";

/** Tiempo máximo que la página espera al manifiesto antes de mostrarse como estaba. */
const HOLD_MS = 1500;

/**
 * El arranque que corre en la web del cliente. Autónomo: recibe las dos funciones como argumentos porque
 * al publicarse como texto no puede importarlas.
 */
function boot(
  apply: (doc: Document, patches: Patch[], path: string, auto: boolean) => void,
  show: (doc: Document, pages: AddedPage[], path: string) => boolean,
  site: string,
  holdMs: number,
): void {
  const script = document.currentScript as HTMLScriptElement | null;
  const origin = script ? new URL(script.src).origin : "";

  // Mientras llega el manifiesto la página no se pinta, para que no se vea el cambio de antes a después.
  const hold = document.createElement("style");
  hold.textContent = "html{visibility:hidden}";
  document.head.appendChild(hold);
  const release = () => hold.remove();
  setTimeout(release, holdMs);

  fetch(`${origin}/api/cms/manifest?site=${encodeURIComponent(site)}`)
    .then((response) => (response.ok ? response.json() : null))
    .then((manifest: Manifest | null) => {
      if (!manifest) return;
      const run = () => {
        if (!show(document, manifest.pages, location.pathname)) {
          apply(document, manifest.patches, location.pathname, manifest.autoResponsive);
        }
      };
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
      else run();
    })
    .catch(() => {})
    .finally(() => setTimeout(release, 0));
}

/** El JavaScript que sirve `/api/cms/runtime` para un sitio: las tres funciones y su arranque. */
export function runtimeScript(site: string): string {
  return `(${boot})(${applyPatches},${showAddedPage},${JSON.stringify(site)},${HOLD_MS});`;
}

/** La etiqueta que el cliente pega en su web. */
export const installSnippet = (cmsOrigin: string, site: string): string =>
  `<script src="${cmsOrigin}/api/cms/runtime?site=${encodeURIComponent(site)}"></script>`;
