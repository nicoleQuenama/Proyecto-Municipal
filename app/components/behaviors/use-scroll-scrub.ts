"use client";

import { useEffect, type RefObject } from "react";
import { durationOf, playAnimation } from "../animation/play";
import { useSite } from "../site/site-context";
import { animationKey, idsOf } from "./animation-ids";
import { scrollProgress } from "./scroll-progress";
import type { Behavior } from "./types";

/**
 * «Mientras haces scroll»: la animación no corre sola, avanza y retrocede al ritmo del scroll,
 * según lo que la pieza ha subido por la pantalla.
 */
export function useScrollScrub(ref: RefObject<HTMLElement | null>, behaviors: Behavior[], active: boolean) {
  const { pages } = useSite();
  const key = animationKey(behaviors, ["scroll"]);

  useEffect(() => {
    const element = ref.current;
    if (!active || !key || !element) return;

    const animations = pages.flatMap((p) => p.animations ?? []).filter((a) => idsOf(key).includes(a.id));
    const scrubbed = animations.map((a) => ({
      total: durationOf(a.steps),
      playback: playAnimation(document, a.steps, { autoplay: false, respectReducedMotion: true }),
    }));

    const update = () => {
      const progress = scrollProgress(element.getBoundingClientRect(), window.innerHeight);
      scrubbed.forEach(({ total, playback }) => playback.seek(progress * total));
    };
    update();
    // En captura: el scroll no sube por el DOM, y la página de prueba se desplaza dentro de su propio contenedor.
    window.addEventListener("scroll", update, { capture: true, passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      scrubbed.forEach(({ playback }) => playback.cancel());
    };
  }, [ref, active, key, pages]);
}
