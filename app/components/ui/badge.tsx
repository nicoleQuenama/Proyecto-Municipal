import type { ReactNode } from "react";

const TONES = {
  neutral: "bg-hover text-ink-dim",
  accent: "bg-accent/25 text-accent",
  success: "bg-green-500/15 text-green-400",
  danger: "bg-red-500/15 text-red-400",
  warning: "bg-amber-500/15 text-amber-400",
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[11px] font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
