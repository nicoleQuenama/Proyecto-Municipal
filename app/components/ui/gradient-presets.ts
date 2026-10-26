import type { Gradient } from "./gradient";

const linear = (angle: number, ...colors: string[]): Gradient => ({
  type: "linear",
  angle,
  stops: colors.map((color, i) => ({ color, position: (i / (colors.length - 1)) * 100 })),
});

/** Degradados prediseñados para elegir con un clic. */
export const GRADIENT_PRESETS: { name: string; gradient: Gradient }[] = [
  { name: "Atardecer", gradient: linear(135, "#ff7e5f", "#feb47b") },
  { name: "Océano", gradient: linear(160, "#2193b0", "#6dd5ed") },
  { name: "Neón", gradient: linear(135, "#f12711", "#f5af19", "#fc00ff") },
  { name: "Bosque", gradient: linear(135, "#134e5e", "#71b280") },
  { name: "Lavanda", gradient: linear(120, "#a18cd1", "#fbc2eb") },
  { name: "Aurora", gradient: linear(135, "#00c9ff", "#92fe9d") },
  { name: "Medianoche", gradient: linear(180, "#0f2027", "#203a43", "#2c5364") },
  { name: "Frambuesa", gradient: linear(135, "#c33764", "#1d2671") },
  { name: "Limón", gradient: linear(90, "#f9f047", "#0fd850") },
  { name: "Cielo", gradient: linear(180, "#4facfe", "#e0f7ff") },
  { name: "Brasas", gradient: linear(45, "#ff0844", "#ffb199") },
  {
    name: "Foco",
    gradient: { type: "radial", angle: 0, stops: [{ color: "#ffffff", position: 0 }, { color: "#1e3a8a", position: 100 }] },
  },
];
