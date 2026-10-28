/** Ver el efecto de una interacción sin salir del editor (lo que no se puede mostrar aquí se explica con un aviso). */

import { runAction } from "./actions";
import { showToast } from "./notify";
import { setVisibility, slideTarget } from "./page-api";
import type { Behavior } from "./types";

const note = (message: string) => showToast(message, "info", "top", 3);

export function previewBehavior(blockId: string, behavior: Behavior) {
  const selector = `[data-target="${CSS.escape(`${blockId}:${behavior.scope}`)}"]`;
  runAction(behavior.action, {
    element: document.querySelector<HTMLElement>(selector),
    goToPage: () => note("Al probar el sitio, aquí se abre la otra página."),
    setVisibility: (key, mode) => setVisibility(blockId, key, mode),
    slide: (key, to) => slideTarget(blockId, key, to),
    openUrl: () => note("Al probar el sitio, aquí se abre el enlace."),
    play: () => note("Esta animación se reproduce al probar el sitio."),
    runCode: () => note("El código se ejecuta al probar el sitio."),
  });
}
