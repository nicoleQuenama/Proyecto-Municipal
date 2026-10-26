/** Tamaño aproximado (KB, minificado) de librerías conocidas que pesan de más. */
const HEAVY_LIBRARIES: Record<string, number> = {
  three: 620,
  moment: 290,
  d3: 270,
  "chart.js": 200,
  lodash: 70,
  jquery: 87,
  "monaco-editor": 2000,
  "@mui/material": 300,
  rxjs: 150,
  "highlight.js": 120,
};

const MIN_HEAVY_KB = 80;

/** KB aproximados si la librería es pesada; null si es ligera o desconocida. */
export function heavyLibrary(name: string): number | null {
  const kb = HEAVY_LIBRARIES[name.trim().toLowerCase()];
  return kb !== undefined && kb >= MIN_HEAVY_KB ? kb : null;
}
