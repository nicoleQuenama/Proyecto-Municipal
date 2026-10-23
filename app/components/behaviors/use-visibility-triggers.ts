"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Behavior, TriggerKind } from "./types";

/**
 * «Al hacer scroll hasta verlo» (la primera vez que aparece en pantalla) y «Al salir de pantalla»
 * (cada vez que, después de verse, deja de verse).
 */
export function useVisibilityTriggers(
  ref: RefObject<HTMLElement | null>,
  behaviors: Behavior[],
  active: boolean,
  run: (trigger: TriggerKind) => void,
) {
  const wanted = behaviors.some((b) => b.trigger === "enter" || b.trigger === "leave");
  const visible = useRef(false);
  const entered = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!active || !wanted || !element) return;

    const observer = new IntersectionObserver((entries) => {
      const now = entries.some((entry) => entry.isIntersecting);
      if (now && !entered.current) {
        entered.current = true;
        run("enter");
      } else if (!now && visible.current) {
        run("leave");
      }
      visible.current = now;
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, active, wanted, run]);
}
