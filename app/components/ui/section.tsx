import type { ReactNode } from "react";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[11px] font-semibold tracking-wider text-ink-dim uppercase">{title}</h3>
      {children}
    </section>
  );
}
