/** El selector de una página concreta: `[data-page-id="inicio"]`. */
export const PAGE_ID_ATTRIBUTE = /\[data-page-id\s*=\s*(?:"[^"]*"|'[^']*')\s*\]/g;

/**
 * Lo que `api` ofrece al código de un bloque de código. El mismo código que se escribió para una página
 * (`api.query('[data-page-id="inicio"] [data-site-page]')`) sigue funcionando: dentro del bloque la «página» es su propio
 * documento. Lo que depende de la página real (navegar, animar…) avisa en la consola en lugar de fallar.
 */
export const API_BRIDGE = `
(() => {
  const page = new RegExp(${JSON.stringify(PAGE_ID_ATTRIBUTE.source)}, "g");
  const normalize = (selector) => String(selector).replace(page, "[data-page-id]");
  const unavailable = (name) => () => console.warn("api." + name + " no está disponible dentro de un bloque de código: solo en el código de la página.");
  window.api = {
    get section() { return document.body; },
    query: (selector) => document.querySelector(normalize(selector)),
    queryAll: (selector) => Array.from(document.querySelectorAll(normalize(selector))),
    log: (...values) => console.log(...values),
    print: (level, ...values) => (console[level] || console.log)(...values),
    navigate: unavailable("navigate"),
    animate: unavailable("animate"),
    show: unavailable("show"),
    hide: unavailable("hide"),
    toggle: unavailable("toggle"),
    openUrl: unavailable("openUrl"),
  };
})();
`;
