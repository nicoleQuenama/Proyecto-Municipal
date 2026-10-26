import { sessionUser } from "../../../server/auth-session";
import { sameOriginRequest } from "../../../server/proxy-guard";

export async function GET(request: Request) {
  if (!sameOriginRequest(request)) return Response.json({ user: null }, { status: 403 });

  return Response.json({ user: await sessionUser() });
}
