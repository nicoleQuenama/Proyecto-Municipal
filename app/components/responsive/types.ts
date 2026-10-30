import type { IconName } from "../icons/icon-set";
import type { AdaptiveDevice, Device } from "./devices";

/** Posición y tamaño de un elemento dentro de su sección. */
export interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** El diseño propio de una sección en un dispositivo: lo define la persona, no se calcula. */
export interface DeviceLayout {
  size: { width: number; height: number };
  /** Por id de elemento; los que faltan conservan el marco del diseño base. */
  frames: Record<string, Frame>;
}

/** Un dispositivo sin entrada se adapta solo (modo automático). */
export type ResponsiveLayouts = Partial<Record<AdaptiveDevice, DeviceLayout>>;

/** Cómo se adapta solo una sección: reduciéndola, en una columna o con parte de ella dentro de un menú. */
export type AutoStrategy = "scale" | "stack" | "menu";

/** Lo que la persona elige para un dispositivo: una de las dos automáticas o su propio diseño. */
export type AdaptMode = AutoStrategy | "manual";

/** La estrategia automática elegida a mano por dispositivo; el que falta usa la inteligente. */
export type AdaptChoices = Partial<Record<Device, AutoStrategy>>;

/** Cómo se abre el panel de un menú: cae bajo la cabecera, entra por un lado o cubre la pantalla. */
export type MenuPanel = "drop" | "left" | "right" | "full";

/** El menú de una sección en tablet y móvil (vale para los dos): qué va dentro y cómo se ve su botón y su panel. */
export interface MenuConfig {
  /** Elementos de la sección que van dentro del menú, en vez de verse en la cabecera. */
  itemIds: string[];
  panel: MenuPanel;
  icon: IconName;
  iconSize: number;
  iconColor?: string;
  /** Colores del panel; sin ellos, los de la sección. */
  panelBackground?: string;
  panelColor?: string;
}

/** Las copias de una lista repetida en una fila deslizable; `cardWidth` es el % del ancho que ocupa cada una. */
export interface CarouselFold {
  kind: "carousel";
  cardWidth: number;
  dots: boolean;
  arrows: boolean;
}

/** La sección se recorta a `maxHeight` px con un degradado y un botón. */
export interface MoreFold {
  kind: "more";
  maxHeight: number;
  moreLabel: string;
  lessLabel: string;
}

/** Todo lo que está bajo el título (por defecto, su primer elemento) se pliega. */
export interface AccordionFold {
  kind: "accordion";
  titleId?: string;
  open: boolean;
}

/** Cómo se presenta una sección larga en pantallas pequeñas (además de su estrategia de adaptación). */
export type FoldConfig = CarouselFold | MoreFold | AccordionFold;

export type FoldKind = FoldConfig["kind"];

/** La presentación elegida por dispositivo; el que falta se ve normal. */
export type FoldChoices = Partial<Record<AdaptiveDevice, FoldConfig>>;
