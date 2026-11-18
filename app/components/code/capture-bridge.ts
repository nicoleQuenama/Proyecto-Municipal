import { CAPTURE_MESSAGE, CAPTURED_MESSAGE } from "./messages";

/**
 * Deja que el editor pida una foto de lo que dibuja el bloque. La saca el propio iframe (el editor no puede leer su
 * documento: va aislado). La librería se carga solo la primera vez que se pide.
 */
export const captureBridge = (origin: string): string => `
(() => {
  const load = () => window.htmlToImage ? Promise.resolve() : new Promise((done, fail) => {
    const script = document.createElement("script");
    script.src = ${JSON.stringify(`${origin}/api/vendor/html-to-image`)};
    script.onload = done;
    script.onerror = () => fail(new Error("No se pudo cargar la librería de captura."));
    document.head.appendChild(script);
  });
  addEventListener("message", async (event) => {
    const data = event.data;
    if (!data || data.type !== "${CAPTURE_MESSAGE}") return;
    const reply = (image, error) => parent.postMessage({ type: "${CAPTURED_MESSAGE}", id: data.id, image, error }, "*");
    try {
      await load();
      reply(await window.htmlToImage.toPng(document.documentElement, { pixelRatio: 1, skipFonts: true, backgroundColor: "#ffffff" }), undefined);
    } catch (error) {
      reply(null, String(error && error.message ? error.message : error));
    }
  });
})();
`;
