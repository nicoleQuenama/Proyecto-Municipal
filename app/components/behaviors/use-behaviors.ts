"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useOrigin } from "../code/use-origin";
import { functionsFor } from "../functions/scope";
import { useNavigation } from "../navigation/navigation-context";
import { useSite } from "../site/site-context";
import { SECTION_KEY } from "../site/types";
import { runAction, type RunContext } from "./actions";
import { executeCode } from "./execute-code";
import { createApi, openUrl, setVisibility } from "./page-api";
import { TRIGGERS } from "./triggers";
import type { Behavior, TriggerKind } from "./types";
import { useAnimationPlayer } from "./use-animation-player";
import { useScrollScrub } from "./use-scroll-scrub";
import { useVisibilityTriggers } from "./use-visibility-triggers";

type Props = Partial<Record<"onClick" | "onPointerEnter", () => void>>;

/**
 * Las interacciones de una sección o elemento, listas para usar al probar el sitio:
 * `ref` va en su elemento del DOM y `props` (clic, cursor encima) se esparcen sobre él.
 */
export function useBehaviors(blockId: string, behaviors: Behavior[], active: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { pages, libraries, functions } = useSite();
  const { followLink } = useNavigation();
  const origin = useOrigin();
  const play = useAnimationPlayer(behaviors, active, ref);

  const run = useCallback(
    (trigger: TriggerKind) => {
      const element = ref.current;
      const api = createApi({ element, blockId, pages, followLink });

      for (const behavior of behaviors) {
        if (behavior.trigger !== trigger) continue;

        // Cada interacción llama a las funciones reutilizables que valen para su sección o elemento.
        const elementId = behavior.scope === SECTION_KEY ? undefined : behavior.scope;
        const context: RunContext = {
          element,
          goToPage: (pageId, transition) => followLink({ kind: "page", pageId, transition }),
          setVisibility: (key, mode) => setVisibility(blockId, key, mode),
          openUrl,
          play,
          runCode: (source, mode) =>
            void executeCode(source, mode, {
              libraries,
              origin,
              api,
              element,
              functions: functionsFor(functions, { blockId, elementId }),
            }),
        };
        runAction(behavior.action, context);
      }
    },
    [behaviors, blockId, pages, followLink, libraries, functions, origin, play],
  );

  // Clic y cursor encima: eventos del propio elemento, según la tabla de disparadores.
  const props = useMemo<Props>(() => {
    if (!active) return {};
    const result: Props = {};
    for (const [trigger, { reactProp }] of Object.entries(TRIGGERS) as [TriggerKind, (typeof TRIGGERS)[TriggerKind]][]) {
      if (reactProp && behaviors.some((b) => b.trigger === trigger)) result[reactProp] = () => run(trigger);
    }
    return result;
  }, [active, behaviors, run]);

  // «Al cargar»: al aparecer la página.
  const hasLoad = behaviors.some((b) => b.trigger === "load");
  useEffect(() => {
    if (active && hasLoad) run("load");
  }, [active, hasLoad, run]);

  useVisibilityTriggers(ref, behaviors, active, run);
  useScrollScrub(ref, behaviors, active);

  return { ref, props };
}
