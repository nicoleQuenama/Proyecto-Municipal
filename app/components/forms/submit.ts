/** Enviar los campos de la página: reúne cada elemento con rol de campo, valida lo obligatorio y los manda a su destino. */

import { normalizeExternalUrl } from "../navigation/links";
import { showToast } from "../behaviors/notify";

interface Field {
  name: string;
  required: boolean;
  value: string | boolean;
}

/** Los campos que hay en la misma página que el elemento que disparó el envío. */
export function collectFields(origin: Element | null): Field[] {
  const root = origin?.closest("[data-site-page]") ?? document;
  return [...root.querySelectorAll<HTMLElement>("[data-control]")].flatMap((wrapper) => {
    const input = wrapper.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select");
    if (!input || !wrapper.dataset.control) return [];
    const value = input instanceof HTMLInputElement && input.type === "checkbox" ? input.checked : input.value;
    return [{ name: wrapper.dataset.control, required: wrapper.dataset.required === "true", value }];
  });
}

/** Los obligatorios que están vacíos (una casilla obligatoria debe estar marcada). */
export const missingFields = (fields: Field[]): string[] =>
  fields.filter((f) => f.required && (f.value === "" || f.value === false)).map((f) => f.name);

const toObject = (fields: Field[]) => Object.fromEntries(fields.map((f) => [f.name, f.value]));

/** Sin destino, el envío es una prueba: valida y avisa, pero no manda nada. */
export async function submitForm(origin: Element | null, url: string, message: string) {
  const fields = collectFields(origin);
  const missing = missingFields(fields);
  if (missing.length > 0) {
    showToast(`Falta completar: ${missing.join(", ")}`, "error", "top", 3);
    return;
  }
  const target = url.trim() ? normalizeExternalUrl(url) : null;
  if (!target) {
    showToast(url.trim() ? "El destino del formulario no es una URL válida" : `${message || "¡Enviado!"} (prueba: sin destino)`, url.trim() ? "error" : "success", "top", 3);
    return;
  }
  try {
    const response = await fetch(target, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(toObject(fields)) });
    showToast(response.ok ? message || "¡Enviado!" : `No se pudo enviar (${response.status})`, response.ok ? "success" : "error", "top", 3);
  } catch {
    showToast("No se pudo enviar: revisa el destino", "error", "top", 3);
  }
}
