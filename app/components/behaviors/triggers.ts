import type { TriggerKind } from "./types";

/**
 * Los disparadores. Los que tienen `reactProp` se escuchan como un evento del elemento;
 * «enter» y «leave» los atiende `use-visibility-triggers.ts`, «scroll» `use-scroll-scrub.ts` y «load» `use-behaviors.ts`.
 */
export const TRIGGERS: Record<TriggerKind, { label: string; reactProp?: "onClick" | "onPointerEnter" }> = {
  click: { label: "Al hacer clic", reactProp: "onClick" },
  hover: { label: "Al pasar el cursor", reactProp: "onPointerEnter" },
  enter: { label: "Al hacer scroll hasta verlo", reactProp: undefined },
  leave: { label: "Al salir de pantalla", reactProp: undefined },
  scroll: { label: "Mientras haces scroll", reactProp: undefined },
  load: { label: "Al cargar la página", reactProp: undefined },
};
