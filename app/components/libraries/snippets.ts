import type { CodeSource } from "../site/types";

type Snippet = (name: string) => Partial<CodeSource>;

/** Ejemplos de uso de librerías conocidas, para empezar con un clic. Una librería nueva es una entrada nueva. */
const SNIPPETS: Record<string, Snippet> = {
  gsap: () => ({
    tailwind: true,
    html: `<div class="flex h-48 items-center justify-center bg-slate-100">\n  <div id="caja" class="h-20 w-20 rounded-2xl bg-sky-500"></div>\n</div>`,
    js: `import gsap from "gsap";\n\ngsap.to("#caja", { x: 160, rotation: 360, duration: 1.6, repeat: -1, yoyo: true, ease: "power2.inOut" });\n`,
  }),
  "chart.js": () => ({
    tailwind: true,
    html: `<div class="p-6">\n  <canvas id="grafico" height="120"></canvas>\n</div>`,
    js: `import { Chart, registerables } from "chart.js";\nChart.register(...registerables);\n\nnew Chart(document.getElementById("grafico") as HTMLCanvasElement, {\n  type: "bar",\n  data: {\n    labels: ["Trámites", "Servicios", "Consultas"],\n    datasets: [{ label: "Solicitudes", data: [12, 19, 7], backgroundColor: "#0ea5e9" }],\n  },\n});\n`,
  }),
  "canvas-confetti": () => ({
    tailwind: true,
    html: `<div class="p-8 text-center">\n  <button id="fiesta" class="rounded-lg bg-pink-500 px-4 py-2 font-semibold text-white">¡Celebrar!</button>\n</div>`,
    js: `import confetti from "canvas-confetti";\n\ndocument.getElementById("fiesta")!.addEventListener("click", () => confetti({ particleCount: 120, spread: 70 }));\n`,
  }),
  animejs: () => ({
    tailwind: true,
    html: `<div class="flex h-48 items-center justify-center">\n  <div id="bola" class="h-12 w-12 rounded-full bg-emerald-500"></div>\n</div>`,
    js: `import { animate } from "animejs";\n\nanimate("#bola", { translateX: 200, loop: true, alternate: true, duration: 1200 });\n`,
  }),
};

/** Un ejemplo genérico para cualquier otra librería: importarla y mostrar qué exporta. */
const generic: Snippet = (name) => ({
  tailwind: true,
  html: `<pre id="salida" class="p-4 text-xs text-slate-700"></pre>`,
  js: `import * as lib from "${name}";\n\ndocument.getElementById("salida")!.textContent = "Exporta: " + Object.keys(lib).join(", ");\n`,
});

/** El código de ejemplo para empezar a usar una librería. */
export const snippetFor = (name: string): Partial<CodeSource> => (SNIPPETS[name] ?? generic)(name);
