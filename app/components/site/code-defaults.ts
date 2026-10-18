import type { CodeSource } from "./types";

/** El componente de fábrica que se coloca como bloque de código. */
export const CODE_COMPONENT_ID = "code-block";

/** El código con el que empieza un bloque nuevo: un ejemplo mínimo con Tailwind y un script. */
export const DEFAULT_CODE: CodeSource = {
  tailwind: true,
  html: `<section class="rounded-2xl bg-slate-900 p-8 text-white">
  <h2 class="text-2xl font-bold">Tu código aquí</h2>
  <p class="mt-2 text-slate-300">Escribe HTML, CSS, Tailwind y TypeScript.</p>
  <button id="saludar" class="mt-4 rounded-lg bg-sky-500 px-4 py-2 font-semibold hover:bg-sky-400">
    Pulsa
  </button>
</section>`,
  css: `/* CSS propio de este bloque */
`,
  js: `const button = document.getElementById("saludar")!;
button.addEventListener("click", () => {
  button.textContent = "¡Hola desde tu bloque de código!";
});
`,
};
