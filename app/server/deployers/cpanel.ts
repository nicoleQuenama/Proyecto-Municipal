import { explain, remotePath, type Deployer } from "./types";
import { uploadTree } from "./upload-tree";

type Strings = Record<string, string>;
const TIMEOUT_MS = 30_000;

/** La dirección del cPanel: acepta «servidor.com», «servidor.com:2083» o con https://; el puerto por defecto es el 2083 (HTTPS). */
function baseUrl(host: string): string {
  const bare = host.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return `https://${bare.includes(":") ? bare : `${bare}:2083`}`;
}

/** Una llamada a la API de cPanel (UAPI o API 2) con el token del usuario; devuelve los datos o el motivo del rechazo. */
async function call(values: Strings, secrets: Strings, path: string, body?: FormData): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const response = await fetch(`${baseUrl(values.host)}${path}`, {
    method: body ? "POST" : "GET",
    headers: { authorization: `cpanel ${values.user}:${secrets.token}` },
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (response.status === 401 || response.status === 403) return { ok: false, error: "cPanel rechazó el usuario o el token de API." };
  const json = (await response.json().catch(() => null)) as { status?: number; errors?: string[] | null; data?: unknown; cpanelresult?: { error?: string; data?: { result?: number; reason?: string }[] } } | null;
  if (!response.ok || !json) return { ok: false, error: `cPanel respondió ${response.status}.` };
  if (json.cpanelresult) {
    const result = json.cpanelresult.data?.[0];
    return json.cpanelresult.error || result?.result === 0 ? { ok: false, error: json.cpanelresult.error ?? result?.reason ?? "cPanel no pudo hacerlo." } : { ok: true, data: json.cpanelresult.data };
  }
  return json.status === 1 ? { ok: true, data: json.data } : { ok: false, error: json.errors?.join(" ") || "cPanel no pudo hacerlo." };
}

const missing = (values: Strings, secrets: Strings) => (!values.host || !values.user || !secrets.token ? "Faltan la dirección del cPanel, el usuario y el token de API." : null);

/** Crea una carpeta (API 2 de Fileman, la única que lo permite): `/a/b` se crea como `b` dentro de `/a`. Si ya existe no es un error. */
async function makeDir(values: Strings, secrets: Strings, path: string): Promise<void> {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return;
  const query = new URLSearchParams({ cpanel_jsonapi_user: values.user, cpanel_jsonapi_apiversion: "2", cpanel_jsonapi_module: "Fileman", cpanel_jsonapi_func: "mkdir", path: parts.slice(0, -1).join("/") || ".", name: parts.at(-1)! });
  const result = await call(values, secrets, `/json-api/cpanel?${query}`);
  if (!result.ok && !/exist|ya existe/i.test(result.error)) throw new Error(result.error);
}

export const cpanel: Deployer = {
  test: async (values, secrets) => {
    const problem = missing(values, secrets);
    if (problem) return { ok: false, error: problem };
    try {
      const result = await call(values, secrets, "/execute/Variables/get_user_information");
      return result.ok ? { ok: true, detail: `Conectado a cPanel (${values.host}) como ${values.user}.` } : result;
    } catch (error) {
      return { ok: false, error: explain(error) };
    }
  },

  deploy: async (values, secrets, files) => {
    const problem = missing(values, secrets);
    if (problem) return { ok: false, error: problem };
    const root = values.dir || "public_html";
    try {
      const uploaded = await uploadTree(
        {
          makeDir: (path) => makeDir(values, secrets, path),
          put: async (path, data) => {
            const form = new FormData();
            const slash = path.lastIndexOf("/");
            form.set("dir", path.slice(0, slash) || "/");
            form.set("overwrite", "1");
            form.set("file-1", new Blob([new Uint8Array(data)]), path.slice(slash + 1));
            const result = await call(values, secrets, "/execute/Fileman/upload_files", form);
            if (!result.ok) throw new Error(result.error);
          },
        },
        root,
        files,
      );
      return { ok: true, detail: `${uploaded} archivos subidos a ${remotePath(root)} en ${values.host}.` };
    } catch (error) {
      return { ok: false, error: explain(error) };
    }
  },
};
