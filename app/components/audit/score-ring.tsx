"use client";

import { useEffect, useState } from "react";
import { BAND_COLORS } from "./category-meta";
import { bandOf } from "./score";

const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Anillo de puntuación 0–100 que se llena con una animación, verde/naranja/rojo como Lighthouse. */
export function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(score));
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const color = BAND_COLORS[bandOf(score)];
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label={`Nota ${score} de 100`}>
      <circle cx="40" cy="40" r={RADIUS} fill="none" stroke={color} strokeOpacity="0.18" strokeWidth="6" />
      <circle
        cx="40"
        cy="40"
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - shown / 100)}
        transform="rotate(-90 40 40)"
        style={{ transition: "stroke-dashoffset 0.9s ease-out" }}
      />
      <text x="40" y="47" textAnchor="middle" fontSize="22" fontWeight="600" fill={color}>
        {score}
      </text>
    </svg>
  );
}
