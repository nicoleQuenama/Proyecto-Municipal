import type { User } from "../auth/types";
import { Badge } from "../ui/badge";
import { describeAccess, modeOf } from "./access-presets";

const MAX_LIMITS = 2;

/** Resume en etiquetas cortas y legibles qué puede hacer una persona dentro del proyecto. */
export function AccessSummary({ user }: { user: User }) {
  const { where, limits, expiry, expired } = describeAccess(user);
  const mode = modeOf(user.access);
  const visible = limits.slice(0, MAX_LIMITS);
  const hidden = limits.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge tone={mode === "view" ? "neutral" : "accent"}>{where}</Badge>
      <Badge tone={expired ? "danger" : "neutral"}>{expiry}</Badge>
      {visible.map((limit) => (
        <Badge key={limit} tone="warning">
          {limit}
        </Badge>
      ))}
      {hidden > 0 && <Badge tone="neutral">+{hidden} más</Badge>}
    </div>
  );
}
