import type { ReactNode } from "react";

export function UserField({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] text-ink-dim">{label}</span>
      <span className="flex h-9 items-center gap-2 rounded-lg border border-line bg-panel px-2.5 focus-within:border-accent/60">
        {icon && <span className="text-ink-dim">{icon}</span>}
        {children}
      </span>
    </label>
  );
}
