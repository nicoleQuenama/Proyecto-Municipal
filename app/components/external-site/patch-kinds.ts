import type { Patch, PatchDevice, PatchKind } from "./types";

const DEVICE_SUFFIX: Record<PatchDevice, string> = { all: "", tablet: " · tablet y móvil", mobile: " · solo móvil" };

/** Cómo se describe cada tipo de cambio. Uno nuevo es una entrada nueva. */
export const PATCH_KINDS: Record<PatchKind, { label: string; summary: (patch: Patch) => string }> = {
  text: { label: "Texto", summary: (p) => `Texto → «${p.value}»` },
  attr: { label: "Atributo", summary: (p) => `${p.name} → ${p.value}` },
  style: { label: "Estilo", summary: (p) => `${p.name}: ${p.value}${DEVICE_SUFFIX[p.device]}` },
  hide: { label: "Visibilidad", summary: (p) => `Oculto${DEVICE_SUFFIX[p.device]}` },
  insert: { label: "Elemento nuevo", summary: (p) => `Texto nuevo debajo: «${p.value}»` },
};
