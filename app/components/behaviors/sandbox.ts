/**
 * Ejecuta el código de una interacción en un iframe aislado (`sandbox="allow-scripts"`, sin origen propio):
 * ese código no puede tocar el editor, y solo puede pedir a la página las acciones de `SandboxApi`.
 */

const CALL_MESSAGE = "portal:call";
const RUN_MESSAGE = "portal:run";

/** Lo que el código del usuario puede pedir a la página, por nombre. */
export interface SandboxApi {
  navigate: (page: string) => void;
  animate: (effect: string, seconds?: number) => void;
  show: (target?: string) => void;
  hide: (target?: string) => void;
  toggle: (target?: string) => void;
  openUrl: (url: string) => void;
  log: (...values: unknown[]) => void;
}

export type SandboxMethod = keyof SandboxApi;

/** La API tal como la ve el código del usuario: cada método solo envía un mensaje a la página. */
const FRAME_SCRIPT = `
  const call = (method, ...args) => parent.postMessage({ type: "${CALL_MESSAGE}", method, args }, "*");
  const api = Object.fromEntries(
    ["navigate", "animate", "show", "hide", "toggle", "openUrl", "log"].map((method) => [method, (...args) => call(method, ...args)])
  );
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  addEventListener("message", async (event) => {
    if (event.source !== parent || event.data?.type !== "${RUN_MESSAGE}") return;
    try {
      await new AsyncFunction("api", event.data.source)(api);
    } catch (error) {
      call("log", "Error en la interacción: " + error.message);
    }
  });
`;

let frame: HTMLIFrameElement | null = null;
let ready: Promise<void> | null = null;
let handler: ((method: SandboxMethod, args: unknown[]) => void) | null = null;

function ensureFrame(): Promise<void> {
  if (ready) return ready;

  const created = document.createElement("iframe");
  created.setAttribute("sandbox", "allow-scripts");
  created.setAttribute("aria-hidden", "true");
  created.style.display = "none";
  created.srcdoc = `<!doctype html><script>${FRAME_SCRIPT}</script>`;
  frame = created;

  window.addEventListener("message", (event) => {
    if (event.source !== created.contentWindow || event.data?.type !== CALL_MESSAGE) return;
    handler?.(event.data.method, Array.isArray(event.data.args) ? event.data.args : []);
  });

  ready = new Promise((resolve) => created.addEventListener("load", () => resolve(), { once: true }));
  document.body.appendChild(created);
  return ready;
}

/** Ejecuta `source` en el sandbox; `onCall` atiende lo que el código pida a la página. */
export async function runInSandbox(source: string, onCall: (method: SandboxMethod, args: unknown[]) => void) {
  await ensureFrame();
  handler = onCall;
  frame?.contentWindow?.postMessage({ type: RUN_MESSAGE, source }, "*");
}
