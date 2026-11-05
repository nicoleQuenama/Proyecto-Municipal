import { Client } from "basic-ftp";
import { Readable } from "node:stream";
import { explain, type Deployer } from "./types";
import { uploadTree } from "./upload-tree";

type Strings = Record<string, string>;
const TIMEOUT_MS = 30_000;

/** Una sesión FTP: se conecta, hace el trabajo y siempre cierra. `secure` = «si» usa FTPS (cifrado). */
async function withFtp<T>(values: Strings, secrets: Strings, work: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client(TIMEOUT_MS);
  try {
    await client.access({
      host: values.host,
      port: Number(values.port) || 21,
      user: values.user,
      password: secrets.password,
      secure: /^(si|sí|yes|true|1)$/i.test((values.secure ?? "").trim()),
    });
    return await work(client);
  } finally {
    client.close();
  }
}

export const ftp: Deployer = {
  test: async (values, secrets) => {
    if (!values.host || !values.user || !secrets.password) return { ok: false, error: "Faltan el servidor, el usuario y la contraseña." };
    try {
      return await withFtp(values, secrets, async (client) => ({ ok: true, detail: `Conectado a ${values.host} (carpeta actual: ${await client.pwd()}).` }));
    } catch (error) {
      return { ok: false, error: explain(error) };
    }
  },

  deploy: async (values, secrets, files) => {
    if (!values.host || !values.user || !secrets.password) return { ok: false, error: "Faltan el servidor, el usuario y la contraseña." };
    try {
      return await withFtp(values, secrets, async (client) => {
        const uploaded = await uploadTree(
          {
            makeDir: (path) => client.ensureDir(path),
            put: async (path, data) => {
              await client.cd("/");
              await client.uploadFrom(Readable.from(data), path);
            },
          },
          values.dir || "/",
          files,
        );
        return { ok: true, detail: `${uploaded} archivos subidos a ${values.dir || "/"} en ${values.host}.` };
      });
    } catch (error) {
      return { ok: false, error: explain(error) };
    }
  },
};
