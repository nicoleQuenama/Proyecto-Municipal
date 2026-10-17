import type { ComponentProps, ReactNode } from "react";

const BASE =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs text-ink transition-colors hover:bg-hover";
const ACTIVE = "bg-accent/25 text-accent hover:bg-accent/30";

export const fieldClass =
  "h-7 shrink-0 rounded-md border border-transparent bg-transparent px-2 text-xs text-ink outline-none hover:border-line focus:border-accent [&>option]:bg-panel";

interface ToolbarButtonProps extends ComponentProps<"button"> {
  label: string;
  active?: boolean;
}

export function ToolbarButton({
  label,
  active,
  className = "",
  ...props
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`${BASE} ${active ? ACTIVE : ""} ${className}`}
      {...props}
    />
  );
}

interface ColorButtonProps {
  label: string;
  value: string;
  active?: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
}

export function ColorButton({
  label,
  value,
  active,
  onChange,
  children,
}: ColorButtonProps) {
  return (
    <label
      title={label}
      className={`${BASE} relative cursor-pointer ${active ? ACTIVE : ""}`}
    >
      <span className="flex flex-col items-center leading-none">
        {children}
        <span className="mt-0.5 h-[3px] w-4 rounded-sm" style={{ background: value }} />
      </span>
      <input
        type="color"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}

export function Separator() {
  return <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line" />;
}
