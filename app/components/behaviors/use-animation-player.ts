"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { playAnimation, type Playback } from "../animation/play";
import { useSite } from "../site/site-context";
import { animationKey, idsOf } from "./animation-ids";
import type { Behavior } from "./types";

/**
 * Reproduce las animaciones de una pieza. Las de «cargar» y «aparecer» quedan listas y en pausa desde el principio,
 * para que la pieza no se vea antes de tiempo, y suenan una sola vez (volver a reproducir una terminada la reiniciaría).
 */
export function useAnimationPlayer(behaviors: Behavior[], active: boolean, scope: RefObject<Element | null>) {
  const { pages } = useSite();
  const pagesRef = useRef(pages);
  const prepared = useRef(new Map<string, Playback>());
  const played = useRef(new Set<string>());

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  const preparedKey = animationKey(behaviors, ["load", "enter"]);

  useEffect(() => {
    if (!active) return;
    const ready = prepared.current;
    const alreadyPlayed = played.current;
    const animations = pagesRef.current.flatMap((p) => p.animations ?? []);

    for (const id of idsOf(preparedKey)) {
      const animation = animations.find((a) => a.id === id);
      if (animation && !ready.has(id)) {
        ready.set(id, playAnimation(document, animation.steps, { autoplay: false, respectReducedMotion: true, within: scope.current }));
      }
    }
    return () => {
      ready.forEach((playback) => playback.cancel());
      ready.clear();
      alreadyPlayed.clear();
    };
  }, [active, preparedKey, scope]);

  return useCallback((animationId: string) => {
    const ready = prepared.current.get(animationId);
    if (ready) {
      if (!played.current.has(animationId)) ready.play();
      played.current.add(animationId);
      return;
    }
    const animation = pagesRef.current.flatMap((p) => p.animations ?? []).find((a) => a.id === animationId);
    if (animation) playAnimation(document, animation.steps, { respectReducedMotion: true, within: scope.current });
  }, [scope]);
}
