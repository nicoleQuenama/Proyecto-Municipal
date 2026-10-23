import type { ReactNode } from "react";

const TONES = {
  neutral: "text-ink",
  warning: "text-amber-400",
  success: "text-green-400",
} as const;

interface StatusCardProps {
  title: string;
  value: ReactNode;
  hint: string;
  tone?: keyof typeof TONES;
}

/** Una cifra o frase de estado con su explicación: lo primero que ve quien abre el panel. */
export function StatusCard({ title, value, hint, tone = "neutral" }: StatusCardProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border border-line bg-canvas p-3">
      <p className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">{title}</p>
      <p className={`truncate text-sm font-semibold ${TONES[tone]}`}>{value}</p>
      <p className="truncate text-xs text-ink-dim">{hint}</p>
    </div>
  );
}
