const COLORS = [
  "bg-sky-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-violet-600",
  "bg-teal-600",
];

/** El mismo nombre siempre recibe el mismo color. */
function colorOf(name: string): string {
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
}

export function Avatar({ name }: { name: string }) {
  return (
    <span
      title={name}
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ring-2 ring-panel ${colorOf(name)}`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

const MAX_VISIBLE = 3;

/** Avatares superpuestos; si hay más de tres, el resto se resume en «+N». */
export function AvatarStack({ names }: { names: string[] }) {
  const visible = names.slice(0, MAX_VISIBLE);
  const hidden = names.length - visible.length;

  return (
    <span className="flex items-center -space-x-1.5" title={names.join(", ")}>
      {visible.map((name) => (
        <Avatar key={name} name={name} />
      ))}
      {hidden > 0 && (
        <span className="z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-hover px-1 text-[11px] text-ink-dim ring-2 ring-panel">
          +{hidden}
        </span>
      )}
    </span>
  );
}
