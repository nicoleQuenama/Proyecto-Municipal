import { inProject } from "../../../server/site-access";
import { createIssue, toggleAssignee, toggleIssue, type NewIssue } from "../../../server/versions/issue-store";
import { versionRoute } from "../../../server/versions/version-route";

const bad = (error: string) => Response.json({ error }, { status: 400 });

/** Reporta un issue: `{ title, label, tone, assignees }`. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as NewIssue | null;
  if (!body) return bad("Faltan datos.");
  return versionRoute(
    request,
    async (actor) => {
      await inProject(actor, (tx, scope) => createIssue(tx, scope, actor.user.id, body));
      return { ok: true };
    },
    201,
  );
}

/** Cambia un issue: `{ number, action: "toggle" }` (cerrar o reabrir) o `{ number, action: "assignee", member }`. */
export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as { number?: unknown; action?: unknown; member?: unknown } | null;
  if (typeof body?.number !== "number" || (body.action !== "toggle" && body.action !== "assignee")) return bad("Faltan datos.");
  const { number, action, member } = body;
  return versionRoute(request, async (actor) => {
    await inProject(actor, (tx, scope) => (action === "toggle" ? toggleIssue(tx, scope, number) : toggleAssignee(tx, scope, number, member)));
    return { ok: true };
  });
}
