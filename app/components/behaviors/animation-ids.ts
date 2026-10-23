import type { Behavior, TriggerKind } from "./types";

/** Las animaciones que reproducen estas interacciones al dispararse con alguno de estos disparadores, unidas en una clave estable. */
export function animationKey(behaviors: Behavior[], triggers: TriggerKind[]): string {
  return behaviors
    .flatMap((b) => (b.action.kind === "play" && triggers.includes(b.trigger) ? [b.action.animationId] : []))
    .join("|");
}

export const idsOf = (key: string): string[] => (key ? key.split("|") : []);
