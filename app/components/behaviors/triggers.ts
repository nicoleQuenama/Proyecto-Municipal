import type { TriggerKind } from "./types";

/**
 * Los disparadores. Los que tienen `reactProp` se escuchan como un evento del elemento;
 * «enter» y «load» los atiende `use-behaviors.ts` con un observador y al montarse.
 */
export const TRIGGERS: Record<TriggerKind, { label: string; reactProp?: "onClick" | "onPointerEnter" }> = {
  click: { label: "Al hacer clic", reactProp: "onClick" },
  hover: { label: "Al pasar el cursor", reactProp: "onPointerEnter" },
  enter: { label: "Al entrar en pantalla", reactProp: undefined },
  load: { label: "Al cargar la página", reactProp: undefined },
};
