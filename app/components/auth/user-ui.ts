import type { UserRole } from "./types";

export const ROLE_OPTIONS: UserRole[] = ["designer", "dev", "superadmin"];

export const AVATAR_GRADIENT: Record<UserRole, string> = {
  superadmin: "from-accent via-[#4f8cff] to-[#7c5cff]",
  dev: "from-emerald-400 via-teal-400 to-cyan-500",
  designer: "from-fuchsia-400 via-violet-400 to-orange-300",
};

export const ROLE_BADGE: Record<UserRole, string> = {
  superadmin: "border-accent/30 bg-accent/10 text-accent",
  dev: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  designer: "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300",
};

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
