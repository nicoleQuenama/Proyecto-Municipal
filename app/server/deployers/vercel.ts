import { randomBytes } from "node:crypto";
import { explain, type BundleFiles, type Deployer } from "./types";

const API = "https://api.vercel.com";
const query = (values: Record<string, string>) => (values.team ? `?teamId=${encodeURIComponent(values.team)}` : "");

export const vercel: Deployer = {
  test: async (values, secrets) => {
    if (!secrets.token) return { ok: false, error: "Falta el token de Vercel." };
    try {
      const response = await fetch(`${API}/v2/user`, { headers: { authorization: `Bearer ${secrets.token}` }, signal: AbortSignal.timeout(15_000) });
      if (response.status === 401 || response.status === 403) return { ok: false, error: "Vercel rechazó el token." };
      const body = (await response.json().catch(() => ({}))) as { user?: { username?: string } };
      return response.ok ? { ok: true, detail: `Conectado a Vercel como ${body.user?.username ?? "tu cuenta"}.` } : { ok: false, error: `Vercel respondió ${response.status}.` };
    } catch (error) {
      return { ok: false, error: explain(error) };
    }
  },

  /** Sube el paquete a Vercel como un despliegue de producción y devuelve la dirección del sitio. */
  deploy: async (values, secrets, bundle: BundleFiles) => {
    const name = (values.project ?? "").trim();
    if (!secrets.token || !name) return { ok: false, error: "Faltan el nombre del proyecto y el token de Vercel." };

    const files = Object.entries(bundle).map(([file, data]) => ({ file, data: Buffer.from(data).toString("base64"), encoding: "base64" }));
    const env = { CMS_MODE: "site", AUTH_SECRET: randomBytes(24).toString("hex") };
    try {
      const response = await fetch(`${API}/v13/deployments${query(values)}`, {
        method: "POST",
        headers: { authorization: `Bearer ${secrets.token}`, "content-type": "application/json" },
        body: JSON.stringify({ name, files, target: "production", projectSettings: { framework: "nextjs" }, env, build: { env } }),
      });
      const body = (await response.json().catch(() => ({}))) as { url?: string; error?: { message?: string } };
      if (!response.ok || !body.url) return { ok: false, error: body.error?.message ?? `Vercel respondió ${response.status}.` };
      return { ok: true, url: `https://${body.url}`, detail: `Desplegado en Vercel (${files.length} archivos).` };
    } catch (error) {
      return { ok: false, error: explain(error) };
    }
  },
};
