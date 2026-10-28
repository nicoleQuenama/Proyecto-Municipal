import { sessionUser } from "../../../server/auth-session";
import { canDeploy } from "../../../server/can-deploy";
import { deployToVercel } from "../../../server/deploy-vercel";
import { isTargetKind, listTargets, readTargetWithSecrets, removeTarget, saveTarget, TARGET_FIELDS } from "../../../server/deploy-targets";
import { sameOriginRequest } from "../../../server/proxy-guard";

/** Entra solo quien puede desplegar; todo lo demás es 401 o 403. */
async function refused(request: Request): Promise<Response | null> {
  if (!sameOriginRequest(request)) return Response.json({ error: "Petición no permitida." }, { status: 403 });
  const user = await sessionUser();
  if (!user) return Response.json({ error: "Tu sesión terminó." }, { status: 401 });
  if (!canDeploy(user)) return Response.json({ error: "No tienes permiso para configurar servidores." }, { status: 403 });
  return null;
}

/** Los destinos guardados (sin sus secretos) y qué datos pide cada tipo. */
export async function GET(request: Request) {
  return (await refused(request)) ?? Response.json({ targets: await listTargets(), kinds: TARGET_FIELDS });
}

export async function PUT(request: Request) {
  const denied = await refused(request);
  if (denied) return denied;
  const { kind, values } = (await request.json().catch(() => ({}))) as { kind?: unknown; values?: Record<string, string> };
  if (!isTargetKind(kind) || !values) return Response.json({ error: "Destino no válido." }, { status: 400 });
  await saveTarget(kind, values);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const denied = await refused(request);
  if (denied) return denied;
  const kind = new URL(request.url).searchParams.get("kind");
  if (!isTargetKind(kind)) return Response.json({ error: "Destino no válido." }, { status: 400 });
  await removeTarget(kind);
  return Response.json({ ok: true });
}

/** Despliega al destino elegido. Hoy se ejecuta Vercel; FTP, SFTP y cPanel necesitan el sitio como archivos estáticos. */
export async function POST(request: Request) {
  const denied = await refused(request);
  if (denied) return denied;
  const { kind } = (await request.json().catch(() => ({}))) as { kind?: unknown };
  if (!isTargetKind(kind)) return Response.json({ error: "Destino no válido." }, { status: 400 });

  const target = await readTargetWithSecrets(kind);
  if (!target) return Response.json({ error: "Primero guarda los datos de este destino." }, { status: 400 });
  if (kind !== "vercel") {
    return Response.json({ error: `El despliegue por ${TARGET_FIELDS[kind].label} aún no está disponible: necesita exportar el sitio como archivos estáticos.` }, { status: 501 });
  }

  const result = await deployToVercel(target.values, target.secrets);
  return result.ok ? Response.json(result) : Response.json({ error: result.error }, { status: 502 });
}
