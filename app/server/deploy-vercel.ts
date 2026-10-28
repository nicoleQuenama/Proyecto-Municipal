import { randomBytes } from "node:crypto";
import { collectBundle } from "./export-bundle";

export type DeployResult = { ok: true; url: string } | { ok: false; error: string };

/** Sube el paquete del proyecto a Vercel como un despliegue de producción y devuelve la dirección del sitio. */
export async function deployToVercel(values: Record<string, string>, secrets: Record<string, string>): Promise<DeployResult> {
  const token = secrets.token;
  const name = (values.project ?? "").trim();
  if (!token || !name) return { ok: false, error: "Faltan el nombre del proyecto y el token de Vercel." };

  const files = Object.entries(await collectBundle("zip")).map(([file, data]) => ({ file, data: Buffer.from(data).toString("base64"), encoding: "base64" }));
  const query = values.team ? `?teamId=${encodeURIComponent(values.team)}` : "";
  const env = { CMS_MODE: "site", AUTH_SECRET: randomBytes(24).toString("hex") };

  try {
    const response = await fetch(`https://api.vercel.com/v13/deployments${query}`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ name, files, target: "production", projectSettings: { framework: "nextjs" }, env, build: { env } }),
    });
    const body = (await response.json().catch(() => ({}))) as { url?: string; error?: { message?: string } };
    if (!response.ok || !body.url) return { ok: false, error: body.error?.message ?? `Vercel respondió ${response.status}.` };
    return { ok: true, url: `https://${body.url}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No se pudo llegar a Vercel." };
  }
}
