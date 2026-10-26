import type { User } from "./types";
import { AVATAR_GRADIENT, initials } from "./user-ui";

export function Avatar({ user, large = false }: { user: User; large?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-linear-to-br font-semibold text-white shadow-lg ring-1 ring-white/15 ${
        AVATAR_GRADIENT[user.role]
      } ${large ? "h-14 w-14 text-lg shadow-xl" : "h-8 w-8 text-[11px]"}`}
    >
      {initials(user.name)}
    </span>
  );
}
