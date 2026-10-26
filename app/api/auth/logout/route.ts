import { endSession } from "../../../server/auth-session";
import { sameOriginRequest } from "../../../server/proxy-guard";

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ error: "Petición no permitida." }, { status: 403 });

  await endSession();
  return Response.json({ ok: true });
}
