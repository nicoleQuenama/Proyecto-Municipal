/** El guion de la página de ejemplo: la misma lista de acciones que haría una persona en el editor, paso a paso. */

import type { ElementKind, Page, SiteAction, SiteState } from "../site/types";
import { SECTION_KEY } from "../site/types";
import type { CanvasElement } from "../site/types";
import type { DemoStep } from "./demo-types";

type Frame = { x: number; y: number; width: number; height: number };

const WHITE = "#ffffff";
const MUTED = "#94a3b8";
const CARD = "#1e293b";
const RED = "#c8102e";
const PAGE_WIDTH = 1024;

/** Los pasos de la demostración sobre el sitio tal como está ahora (las páginas con función de carga y 404, y la de inicio). */
export function buildDemo(site: SiteState): DemoStep[] {
  const steps: DemoStep[] = [];
  const clears: DemoStep[] = [];
  let count = 0;
  // Cada ejecución usa ids propios: los borrados de la anterior no deben alcanzar lo que se construye ahora.
  const run = Date.now().toString(36);

  const home = site.pages.find((page) => page.isHome);
  const loading = site.pages.find((page) => page.role === "loading");
  const notFound = site.pages.find((page) => page.role === "not-found");

  const draw = (pageId: string, kind: ElementKind, frame: Frame, overrides: Partial<CanvasElement>, label: string) => {
    count += 1;
    const blockId = `demo-${run}-b${count}`;
    const componentId = `demo-${run}-c${count}`;
    steps.push({
      target: { pageId, frame },
      action: { type: "shape/draw", pageId, blockId, componentId, kind, label, overrides, frame },
    });
    return { blockId, componentId, elementId: `${componentId}-forma` };
  };
  const rect = (pageId: string, frame: Frame, fill: string, radius = 12) => draw(pageId, "rect", frame, { fill, radius }, "Rectángulo");
  const text = (pageId: string, frame: Frame, content: string, style: Partial<CanvasElement> = {}) =>
    draw(pageId, "text", frame, { text: content, color: WHITE, fontSize: 16, ...style }, "Texto");
  const select = (pageId: string): DemoStep => ({ action: { type: "page/select", id: pageId } });
  const clear = (page: Page, only?: (id: string) => boolean): DemoStep[] =>
    page.blocks.filter((block) => !only || only(block.id)).map((block) => ({ action: { type: "block/remove", id: block.id } }));

  if (home) {
    const id = home.id;
    clears.push(...clear(home, (blockId) => blockId.startsWith("demo-")));
    steps.push(select(id));

    // Menú de la izquierda: el ☰ que ya está en la cabecera abre y cierra un panel que empieza oculto.
    const burgerComponent = site.components.find((c) => c.elements.some((el) => el.text?.trim() === "☰"));
    const burgerBlock = home.blocks.find((block) => block.componentId === burgerComponent?.id);
    // La interacción va en el elemento ☰ (no en toda su sección: el ☰ puede ir dentro de un grupo).
    const burgerScope = burgerComponent?.elements.find((el) => el.text?.trim() === "☰")?.id ?? SECTION_KEY;
    if (burgerBlock) {
      // Las interacciones que dejó una ejecución anterior en ese bloque.
      for (const old of burgerBlock.behaviors ?? []) {
        if (old.id.startsWith("demo-")) clears.push({ action: { type: "behavior/remove", pageId: id, blockId: burgerBlock.id, behaviorId: old.id } });
      }
      const panel = rect(id, { x: 20, y: 64, width: 230, height: 190 }, "#0f172a", 10);
      const items = text(id, { x: 40, y: 80, width: 190, height: 160 }, "Sinopsis\nEquipo técnico\nVídeos\nGalería", { fontSize: 18, color: WHITE });
      const behavior = (n: string, trigger: "load" | "click", blockId: string, mode: "hide" | "toggle", on: string) =>
        steps.push({ action: { type: "behavior/save", pageId: id, blockId: on, behavior: { id: `demo-${run}-${n}`, scope: on === burgerBlock?.id ? burgerScope : SECTION_KEY, trigger, action: { kind: "toggle", targetKey: `@${blockId}`, mode } } } });
      steps.push({ action: { type: "block/order", pageId: id, blockIds: [panel.blockId, items.blockId], to: "front" } });
      for (const part of [panel, items]) {
        behavior(`hide-${part.blockId}`, "load", part.blockId, "hide", part.blockId);
        behavior(`open-${part.blockId}`, "click", part.blockId, "toggle", burgerBlock.id);
      }
    }

    // Botón con notificación
    const reserve = rect(id, { x: 60, y: 540, width: 200, height: 44 }, RED, 8);
    steps.push({ action: { type: "behavior/save", pageId: id, blockId: reserve.blockId, behavior: { id: "demo-toast", scope: SECTION_KEY, trigger: "click", action: { kind: "toast", message: "¡Te avisaremos del estreno!", tone: "success", place: "bottom-right", seconds: 3 } } } });
    text(id, { x: 60, y: 550, width: 200, height: 26 }, "AVÍSAME", { fontSize: 16, bold: true, align: "center" });

    // Sinopsis
    text(id, { x: 60, y: 600, width: 400, height: 50 }, "SINOPSIS", { fontSize: 40, bold: true });
    text(id, { x: 60, y: 670, width: 560, height: 130 }, "Cuando la ciudad pierde a su guardián, una joven ingeniera hereda el traje y un secreto. Entre sombras y alianzas inesperadas, deberá decidir quién quiere ser.", { color: "#cbd5e1", fontSize: 17 });
    for (const [x, label] of [[60, "DIRIGIDA POR"], [360, "GUION"]] as const) {
      text(id, { x, y: 830, width: 260, height: 26 }, label, { fontSize: 14, bold: true, color: MUTED });
      text(id, { x, y: 862, width: 260, height: 30 }, "Nombre Apellido", { fontSize: 18 });
    }

    // Equipo técnico
    text(id, { x: 60, y: 1000, width: 500, height: 50 }, "EQUIPO TÉCNICO", { fontSize: 32, bold: true });
    ["Dirección", "Guion", "Producción", "Fotografía", "Música", "Montaje"].forEach((role, i) => {
      const x = 60 + i * 160;
      rect(id, { x, y: 1070, width: 140, height: 190 }, CARD);
      rect(id, { x, y: 1252, width: 140, height: 8 }, RED, 0);
      text(id, { x, y: 1272, width: 140, height: 24 }, `Nombre ${i + 1}`, { fontSize: 16, bold: true });
      text(id, { x, y: 1298, width: 140, height: 22 }, role, { fontSize: 14, color: MUTED });
    });

    // Vídeos
    text(id, { x: 60, y: 1400, width: 400, height: 50 }, "VÍDEOS", { fontSize: 32, bold: true });
    ["Tráiler oficial", "Nuevo tráiler", "Tráiler final"].forEach((title, i) => {
      const x = 60 + i * 320;
      rect(id, { x, y: 1460, width: 264, height: 150 }, CARD);
      text(id, { x, y: 1505, width: 264, height: 56 }, "▶", { fontSize: 48, align: "center", color: RED });
      text(id, { x, y: 1622, width: 264, height: 24 }, title, { fontSize: 16 });
    });

    // Galería
    text(id, { x: 60, y: 1700, width: 400, height: 50 }, "GALERÍA", { fontSize: 32, bold: true });
    [0, 1, 2].forEach((i) => rect(id, { x: 60 + i * 320, y: 1760, width: 264, height: 150 }, "#334155"));

    // Partners
    text(id, { x: 60, y: 1980, width: 400, height: 50 }, "PARTNERS", { fontSize: 32, bold: true });
    [0, 1, 2, 3].forEach((i) => {
      const x = 60 + i * 235;
      rect(id, { x, y: 2040, width: 210, height: 60 }, CARD, 8);
      text(id, { x, y: 2058, width: 210, height: 24 }, `Partner ${i + 1}`, { fontSize: 15, align: "center", color: MUTED });
    });
    // Contacto: campos con rol (texto, correo obligatorio) y un botón que envía.
    text(id, { x: 60, y: 2160, width: 400, height: 50 }, "CONTACTO", { fontSize: 32, bold: true });
    const role = (shape: { componentId: string; elementId: string }, control: Extract<SiteAction, { type: "component/control" }>["control"]) =>
      steps.push({ action: { type: "component/control", componentId: shape.componentId, elementId: shape.elementId, control } });
    const field = (y: number, label: string, kind: "input" | "textarea", name: string, placeholder: string, extra: object = {}) => {
      const shape = draw(id, "rect", { x: 60, y, width: 420, height: kind === "textarea" ? 110 : 48 }, { fill: "#1e293b", radius: 8, color: WHITE, fontSize: 16, text: "" }, label);
      role(shape, { kind });
      role(shape, { name, placeholder, ...extra });
    };
    field(2230, "Campo nombre", "input", "nombre", "Tu nombre", { required: true });
    field(2290, "Campo correo", "input", "correo", "tu@correo.com", { inputType: "email", required: true });
    field(2350, "Campo mensaje", "textarea", "mensaje", "Cuéntanos qué te interesa");
    const send = draw(id, "rect", { x: 60, y: 2480, width: 200, height: 48 }, { fill: RED, radius: 8, color: WHITE, fontSize: 16, bold: true, text: "ENVIAR" }, "Botón enviar");
    role(send, { kind: "submit" });
    text(id, { x: 60, y: 2580, width: 700, height: 24 }, "© 2026 Centinela: Nueva Era · Web de ejemplo", { fontSize: 14, color: "#64748b" });
  }

  if (loading) {
    const id = loading.id;
    clears.push(...clear(loading));
    steps.push(select(id));
    rect(id, { x: 0, y: 0, width: PAGE_WIDTH, height: 600 }, "#b30d27", 0);
    steps.push({ action: { type: "page/color", pageId: id, color: "#b30d27" } });
    const counter = text(id, { x: 0, y: 190, width: PAGE_WIDTH, height: 190 }, "0%", { fontSize: 120, bold: true, align: "center" });
    steps.push({
      action: {
        type: "behavior/save",
        pageId: id,
        blockId: counter.blockId,
        behavior: { id: "demo-count", scope: SECTION_KEY, trigger: "load", action: { kind: "count", from: 0, to: 100, seconds: 2, suffix: "%" } },
      },
    });
  }

  if (notFound) {
    const id = notFound.id;
    clears.push(...clear(notFound));
    steps.push(select(id));
    rect(id, { x: 0, y: 0, width: PAGE_WIDTH, height: 600 }, "#0a0a12", 0);
    steps.push({ action: { type: "page/color", pageId: id, color: "#0a0a12" } });
    text(id, { x: 0, y: 140, width: PAGE_WIDTH, height: 170 }, "404", { fontSize: 140, bold: true, align: "center", color: RED });
    text(id, { x: 0, y: 320, width: PAGE_WIDTH, height: 40 }, "Página no encontrada", { fontSize: 28, align: "center" });
    const back = text(id, { x: 0, y: 385, width: PAGE_WIDTH, height: 30 }, "Volver al inicio →", { fontSize: 18, align: "center", color: "#93c5fd" });
    if (home) {
      steps.push({ action: { type: "link/set", componentId: back.componentId, elementId: back.elementId, link: { kind: "page", pageId: home.id } } });
    }
  }

  if (home) steps.push(select(home.id));
  return [...clears, ...steps];
}
