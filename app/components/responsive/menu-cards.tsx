"use client";

import { OptionCards, PhoneArt, type CardOption } from "./option-cards";
import { PANEL_ORDER, PANEL_STYLES } from "./menu-panels";
import type { MenuPanel } from "./types";

const HEADER = <path d="M6 9h28" />;
const PANEL = { fill: "currentColor", fillOpacity: 0.35, stroke: "none" } as const;

/** El dibujo de cada panel dentro de un teléfono. Uno nuevo es una entrada nueva. */
const ART: Record<MenuPanel, React.ReactNode> = {
  drop: <>{HEADER}<rect x="5" y="13" width="30" height="16" rx="2" {...PANEL} /></>,
  left: <>{HEADER}<rect x="4" y="4" width="17" height="46" rx="3" {...PANEL} /></>,
  right: <>{HEADER}<rect x="19" y="4" width="17" height="46" rx="3" {...PANEL} /></>,
  full: <>{HEADER}<rect x="4" y="4" width="32" height="46" rx="3" {...PANEL} /><path d="M29 10l4 4m0-4l-4 4" /></>,
};

const OPTIONS: CardOption<MenuPanel>[] = PANEL_ORDER.map((value) => ({
  value,
  label: PANEL_STYLES[value].label,
  help: PANEL_STYLES[value].help,
  art: <PhoneArt>{ART[value]}</PhoneArt>,
}));

/** Las cuatro formas de abrir el menú, como tarjetas con dibujo. */
export function MenuPanelCards({ value, onPick }: { value: MenuPanel; onPick: (panel: MenuPanel) => void }) {
  return <OptionCards label="Cómo se abre el menú" value={value} options={OPTIONS} onPick={onPick} />;
}
