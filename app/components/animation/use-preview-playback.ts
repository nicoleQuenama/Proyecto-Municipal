"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { durationOf, playAnimation, type Playback } from "./play";
import type { AnimationStep } from "./types";

/**
 * Reproduce una animación sobre un escenario con controles de vídeo: pausa, repetir y saltar a un instante.
 * Al editar los pasos la animación se rehace en el mismo instante, así lo que se cambia se ve donde se está mirando.
 */
export function usePreviewPlayback(steps: AnimationStep[]) {
  const stageRef = useRef<HTMLDivElement>(null);
  const run = useRef<Playback | null>(null);
  /** El instante (ms) al que vuelve la animación cuando se rehace. */
  const resumeAt = useRef(0);
  const playingRef = useRef(true);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [version, setVersion] = useState(0);
  const total = durationOf(steps);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const playback = playAnimation(stage, steps, { autoplay: playingRef.current });
    playback.seek(resumeAt.current);
    run.current = playback;
    return playback.cancel;
  }, [steps, version]);

  // Mientras suena, el indicador de tiempo sigue a la animación.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      const now = run.current?.time() ?? 0;
      resumeAt.current = now;
      setTime(now);
      if (now >= total) {
        playingRef.current = false;
        setPlaying(false);
      } else {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, total, version]);

  const pause = useCallback(() => {
    run.current?.pause();
    resumeAt.current = run.current?.time() ?? resumeAt.current;
    playingRef.current = false;
    setPlaying(false);
  }, []);

  const replay = useCallback(() => {
    resumeAt.current = 0;
    playingRef.current = true;
    setPlaying(true);
    setVersion((v) => v + 1);
  }, []);

  const toggle = useCallback(() => {
    if (playing) return pause();
    if (resumeAt.current >= total) return replay();
    playingRef.current = true;
    run.current?.play();
    setPlaying(true);
  }, [playing, total, pause, replay]);

  const seek = useCallback(
    (ms: number) => {
      pause();
      run.current?.seek(ms);
      resumeAt.current = ms;
      setTime(ms);
    },
    [pause],
  );

  /** Salta a un instante y sigue desde ahí (el botón «Ver» de cada efecto). */
  const playFrom = useCallback((ms: number) => {
    run.current?.seek(ms);
    run.current?.play();
    resumeAt.current = ms;
    playingRef.current = true;
    setTime(ms);
    setPlaying(true);
  }, []);

  return { stageRef, time, playing, total, toggle, replay, pause, seek, playFrom };
}
