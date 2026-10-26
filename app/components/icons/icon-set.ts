import { BRAND_ICONS } from "./set-brands";
import { INTERFACE_ICONS } from "./set-interface";
import { OBJECT_ICONS } from "./set-objects";

/** Todos los íconos: nombre → trazos. Uno nuevo es una entrada nueva en su categoría (y su nombre en `icon-labels.ts`). */
export const ICON_PATHS: Record<IconName, string[]> = { ...INTERFACE_ICONS, ...OBJECT_ICONS, ...BRAND_ICONS };

export type IconName = keyof typeof INTERFACE_ICONS | keyof typeof OBJECT_ICONS | keyof typeof BRAND_ICONS;

export const ICON_NAMES = Object.keys(ICON_PATHS) as IconName[];

export const isIconName = (value: unknown): value is IconName => typeof value === "string" && value in ICON_PATHS;
