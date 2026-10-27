/** Avisos que una interacción muestra encima de la página: notificaciones (toast) y diálogos con botón. */

export type NoticeTone = "info" | "success" | "warning" | "error";
export type NoticePlace = "top" | "bottom" | "top-right" | "bottom-right";

export const MAX_NOTICE_SECONDS = 30;

export const TONE_LABELS: Record<NoticeTone, string> = { info: "Información", success: "Éxito", warning: "Aviso", error: "Error" };
export const PLACE_LABELS: Record<NoticePlace, string> = {
  top: "Arriba al centro",
  bottom: "Abajo al centro",
  "top-right": "Arriba a la derecha",
  "bottom-right": "Abajo a la derecha",
};

const TONE_COLORS: Record<NoticeTone, string> = { info: "#2563eb", success: "#16a34a", warning: "#d97706", error: "#dc2626" };

/** Dónde se ancla el aviso en la ventana. */
export const PLACE_STYLES: Record<NoticePlace, Record<string, string>> = {
  top: { top: "20px", left: "50%", transform: "translateX(-50%)" },
  bottom: { bottom: "20px", left: "50%", transform: "translateX(-50%)" },
  "top-right": { top: "20px", right: "20px" },
  "bottom-right": { bottom: "20px", right: "20px" },
};

const el = (styles: Record<string, string>, text?: string) => {
  const node = document.createElement("div");
  Object.assign(node.style, styles);
  if (text !== undefined) node.textContent = text;
  return node;
};

/** Una notificación que se va sola a los `seconds` segundos; devuelve el nodo para poder quitarla antes. */
export function showToast(message: string, tone: NoticeTone, place: NoticePlace, seconds: number): HTMLElement {
  const toast = el(
    {
      position: "fixed", zIndex: "2147483000", maxWidth: "min(360px, 90vw)", padding: "12px 16px", borderRadius: "10px",
      background: "#111827", color: "#fff", font: "14px system-ui, sans-serif", borderLeft: `4px solid ${TONE_COLORS[tone]}`,
      boxShadow: "0 8px 24px rgba(0,0,0,.35)", transition: "opacity .25s", ...PLACE_STYLES[place],
    },
    message,
  );
  toast.setAttribute("role", "status");
  document.body.append(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 260);
  }, Math.min(MAX_NOTICE_SECONDS, Math.max(0.5, seconds)) * 1000);
  return toast;
}

/** Un diálogo centrado con título, mensaje y un botón que lo cierra (también al pulsar fuera o Escape). */
export function showDialog(title: string, message: string, button: string): HTMLElement {
  const backdrop = el({ position: "fixed", inset: "0", zIndex: "2147483000", display: "grid", placeItems: "center", background: "rgba(0,0,0,.55)" });
  const box = el({
    width: "min(420px, 90vw)", padding: "24px", borderRadius: "14px", background: "#fff", color: "#111827",
    font: "14px system-ui, sans-serif", boxShadow: "0 20px 50px rgba(0,0,0,.4)",
  });
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  const heading = el({ font: "600 18px system-ui, sans-serif", marginBottom: "8px" }, title);
  const body = el({ lineHeight: "1.5", marginBottom: "20px" }, message);
  const close = document.createElement("button");
  Object.assign(close.style, { padding: "8px 18px", borderRadius: "8px", border: "0", background: "#111827", color: "#fff", cursor: "pointer", font: "inherit" });
  close.textContent = button || "Aceptar";

  const done = () => {
    backdrop.remove();
    window.removeEventListener("keydown", onKey);
  };
  const onKey = (e: KeyboardEvent) => e.key === "Escape" && done();
  close.addEventListener("click", done);
  backdrop.addEventListener("click", (e) => e.target === backdrop && done());
  window.addEventListener("keydown", onKey);

  box.append(heading, body, close);
  backdrop.append(box);
  document.body.append(backdrop);
  close.focus();
  return backdrop;
}
