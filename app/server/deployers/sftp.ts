import SftpClient from "ssh2-sftp-client";
import { explain, remotePath, type Deployer } from "./types";
import { uploadTree } from "./upload-tree";

type Strings = Record<string, string>;
const TIMEOUT_MS = 20_000;

/** Una sesión SFTP (SSH con contraseña): se conecta, hace el trabajo y siempre cierra. */
async function withSftp<T>(values: Strings, secrets: Strings, work: (client: SftpClient) => Promise<T>): Promise<T> {
  const client = new SftpClient();
  try {
    await client.connect({ host: values.host, port: Number(values.port) || 22, username: values.user, password: secrets.password, readyTimeout: TIMEOUT_MS });
    return await work(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

export const sftp: Deployer = {
  test: async (values, secrets) => {
    if (!values.host || !values.user || !secrets.password) return { ok: false, error: "Faltan el servidor, el usuario y la contraseña." };
    try {
      return await withSftp(values, secrets, async (client) => ({ ok: true, detail: `Conectado a ${values.host} (carpeta actual: ${await client.cwd()}).` }));
    } catch (error) {
      return { ok: false, error: explain(error) };
    }
  },

  deploy: async (values, secrets, files) => {
    if (!values.host || !values.user || !secrets.password) return { ok: false, error: "Faltan el servidor, el usuario y la contraseña." };
    try {
      return await withSftp(values, secrets, async (client) => {
        const root = values.dir || "/";
        const uploaded = await uploadTree({ makeDir: async (path) => void (await client.mkdir(path, true)), put: async (path, data) => void (await client.put(data, path)) }, root, files);
        return { ok: true, detail: `${uploaded} archivos subidos a ${remotePath(root)} en ${values.host}.` };
      });
    } catch (error) {
      return { ok: false, error: explain(error) };
    }
  },
};
