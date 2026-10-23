"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useNavigation } from "../navigation/navigation-context";
import { useCurrentPage, useSite } from "../site/site-context";
import { useRecorder } from "./recorder-context";
import { AnimatePanel } from "./animate-panel";
import { PRESETS, type PresetId } from "./presets";

/** Los efectos de un toque mientras se graba. */
const QUICK_EFFECTS: PresetId[] = ["fade-in", "fade-out", "grow"];

const buttonClass =
  "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-ink transition-colors hover:bg-hover disabled:opacity-40 disabled:hover:bg-transparent";

function Button({ children, ...props }: React.ComponentProps<"button">) {
  return (
    <button type="button" {...props} className={`${buttonClass} ${props.className ?? ""}`}>
      {children}
    </button>
  );
}

/** El tiempo que lleva la grabación, como 0:07. */
function Clock({ since }: { since: number }) {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(performance.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const seconds = Math.floor((now - since) / 1000);
  return <span className="tabular-nums">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>;
}

function Recording({ since }: { since: number }): ReactNode {
  const { stepCount, canAddEffect, finish, cancel, addEffect } = useRecorder();

  return (
    <>
      <span className="flex items-center gap-2 px-2 text-xs">
        <span className="size-2.5 animate-pulse rounded-full bg-red-500" aria-hidden />
        Grabando <Clock since={since} /> · {stepCount} {stepCount === 1 ? "paso" : "pasos"}
      </span>
      {QUICK_EFFECTS.map((effect) => (
        <Button
          key={effect}
          disabled={!canAddEffect}
          title={canAddEffect ? "Añade este efecto a lo seleccionado" : "Selecciona una sección o elemento"}
          onClick={() => addEffect(effect)}
        >
          {PRESETS[effect].label}
        </Button>
      ))}
      <Button onClick={finish} className="bg-accent text-white hover:bg-accent/80">Finish Animation</Button>
      <Button onClick={cancel} className="text-ink-dim">Cancelar</Button>
    </>
  );
}

/** Arriba al centro del lienzo: empezar a grabar una animación, terminarla y ver las ya grabadas. */
export function RecorderBar() {
  const { mode } = useNavigation();
  const page = useCurrentPage();
  const site = useSite();
  const { startedAt, notice, canAddEffect, start, openPreview } = useRecorder();
  const [animating, setAnimating] = useState(false);
  if (mode !== "edit") return null;

  const animations = page.animations ?? [];

  return (
    <div className="absolute bottom-20 left-1/2 z-30 flex max-w-[calc(100%-2rem)] -translate-x-1/2 flex-col-reverse items-center gap-1.5">
      <div role="toolbar" aria-label="Grabador de animaciones" className="flex items-center gap-1 rounded-xl border border-line bg-panel p-1.5 text-ink shadow-2xl">
        {startedAt === null ? (
          <>
            <Button
              disabled={!canAddEffect}
              title={canAddEffect ? "Elige un efecto sin grabar nada" : "Selecciona una sección o un elemento"}
              onClick={() => setAnimating((open) => !open)}
              className="bg-accent text-white hover:bg-accent/80"
            >
              ✦ Animar
            </Button>
            <Button onClick={start}>
              <span className="size-2.5 rounded-full bg-red-500" aria-hidden /> Start Animation
            </Button>
            <Button disabled={animations.length === 0} onClick={() => openPreview(animations[animations.length - 1].id)}>
              ▶ Animaciones ({animations.length})
            </Button>
          </>
        ) : (
          <Recording since={startedAt} />
        )}
      </div>
      {animating && startedAt === null && canAddEffect && (
        <AnimatePanel key={`${site.selectedId}:${site.selectedElementId}:${site.alsoSelectedIds?.join(",")}`} onClose={() => setAnimating(false)} />
      )}
      {notice && startedAt === null && (
        <p className="rounded-md bg-panel px-2 py-1 text-[11px] text-ink-dim shadow-lg">{notice}</p>
      )}
    </div>
  );
}
