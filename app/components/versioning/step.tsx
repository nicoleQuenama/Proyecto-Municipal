import type { ReactNode } from "react";
import { CheckIcon } from "./versioning-icons";

interface StepProps {
  number: number;
  title: string;
  done: boolean;
  children: ReactNode;
}

export function Step({ number, title, done, children }: StepProps) {
  return (
    <section className="flex gap-3">
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          done ? "bg-green-500/20 text-green-400" : "bg-hover text-ink-dim"
        }`}
      >
        {done ? <CheckIcon /> : number}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h3 className="text-[13px] font-semibold">{title}</h3>
        {children}
      </div>
    </section>
  );
}
