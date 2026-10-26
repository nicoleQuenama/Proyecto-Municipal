import type { ReactNode } from "react";
import type { AdaptMode } from "./types";

const icon = (paths: ReactNode) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    {paths}
  </svg>
);

/** Las formas de adaptar una sección: su etiqueta, icono y una frase que explica qué hace. */
export const STRATEGY_OPTIONS: { mode: AdaptMode; label: string; help: string; icon: ReactNode }[] = [
  {
    mode: "scale",
    label: "Escalar",
    help: "Encoge la sección entera, tal cual, hasta que quepa. Ideal para una sola pieza (un banner, una imagen).",
    icon: icon(<><rect x="1.5" y="1.5" width="13" height="13" rx="1.5" /><rect x="1.5" y="1.5" width="6" height="6" rx="1" /></>),
  },
  {
    mode: "stack",
    label: "Apilar",
    help: "Pone los elementos uno bajo otro a todo el ancho, en orden de lectura. Ideal para secciones con varias piezas.",
    icon: icon(<><rect x="3" y="1.5" width="10" height="3.5" rx="1" /><rect x="3" y="6.3" width="10" height="3.5" rx="1" /><rect x="3" y="11" width="10" height="3.5" rx="1" /></>),
  },
  {
    mode: "menu",
    label: "Menú",
    help: "Los enlaces se esconden tras un botón; al tocarlo se abre un panel con ellos. Ideal para cabeceras.",
    icon: icon(<path d="M2.5 4h11M2.5 8h11M2.5 12h11" />),
  },
  {
    mode: "manual",
    label: "Lo defino yo",
    help: "Mueve y ajusta cada elemento a tu gusto para este dispositivo.",
    icon: icon(<path d="M3 2l9 5-4 1.2L6.8 12 3 2z" />),
  },
];
