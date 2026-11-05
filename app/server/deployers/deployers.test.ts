import { afterEach, describe, expect, it, vi } from "vitest";
import { cpanel } from "./cpanel";
import { DEPLOYERS } from "./index";
import { directoriesOf, explain, remotePath } from "./types";

const bytes = (text: string) => new TextEncoder().encode(text);

describe("rutas remotas", () => {
  it("unen sin dobles barras y no dejan salirse hacia arriba", () => {
    expect(remotePath("/public_html/", "sitio", "app/page.tsx")).toBe("/public_html/sitio/app/page.tsx");
    expect(remotePath("../../etc", "passwd")).toBe("/etc/passwd");
    expect(remotePath("")).toBe("/");
  });

  it("piden crear primero las carpetas más cercanas a la raíz", () => {
    expect(directoriesOf("public_html/sitio", { "a.txt": bytes("x"), "app/server/b.ts": bytes("x") })).toEqual([
      "/public_html",
      "/public_html/sitio",
      "/public_html/sitio/app",
      "/public_html/sitio/app/server",
    ]);
  });

  it("dicen los errores de red con palabras", () => {
    expect(explain({ code: "ENOTFOUND" })).toContain("No se encontró ese servidor");
    expect(explain({ cause: { code: "ECONNREFUSED" } })).toContain("rechazó la conexión");
    expect(explain(new Error("otro"))).toBe("otro");
  });
});

describe("todos los tipos de servidor", () => {
  it("tienen cómo probarse y cómo desplegar", () => {
    for (const kind of ["vercel", "ftp", "sftp", "cpanel"] as const) {
      expect(typeof DEPLOYERS[kind].test).toBe("function");
      expect(typeof DEPLOYERS[kind].deploy).toBe("function");
    }
  });

  it("piden lo que falta antes de conectarse", async () => {
    for (const kind of ["ftp", "sftp", "cpanel"] as const) expect(await DEPLOYERS[kind].test({}, {})).toMatchObject({ ok: false });
    expect(await DEPLOYERS.vercel.test({}, {})).toMatchObject({ ok: false, error: "Falta el token de Vercel." });
  });
});

describe("cPanel", () => {
  afterEach(() => vi.unstubAllGlobals());
  const values = { host: "servidor.com", user: "ana", dir: "public_html/sitio" };
  const secrets = { token: "TOKEN" };

  it("entra con el token del usuario en el puerto 2083", async () => {
    const fetchMock = vi.fn(async (...args: [string, RequestInit?]) => (args.length > 0 ? Response.json({ status: 1, errors: null, data: {} }) : new Response()));
    vi.stubGlobal("fetch", fetchMock);
    const result = await cpanel.test(values, secrets);
    expect(result).toMatchObject({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://servidor.com:2083/execute/Variables/get_user_information");
    expect((init.headers as Record<string, string>).authorization).toBe("cpanel ana:TOKEN");
  });

  it("dice con claridad que rechazó el token", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 401 })));
    expect(await cpanel.test(values, secrets)).toEqual({ ok: false, error: "cPanel rechazó el usuario o el token de API." });
  });

  it("crea las carpetas y sube cada archivo a su carpeta", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => (init && String(url).includes("upload_files") ? Response.json({ status: 1, errors: null, data: {} }) : Response.json({ cpanelresult: { data: [{ result: 1 }] } })));
    vi.stubGlobal("fetch", fetchMock);
    const result = await cpanel.deploy(values, secrets, { "index.html": bytes("<b>"), "app/x.ts": bytes("x") });
    expect(result).toMatchObject({ ok: true, detail: expect.stringContaining("2 archivos") });

    const calls = fetchMock.mock.calls.map(([url, init]) => ({ url: String(url), body: (init as RequestInit | undefined)?.body }));
    const uploads = calls.filter((call) => call.url.includes("upload_files")).map((call) => (call.body as FormData).get("dir"));
    expect(uploads).toEqual(["/public_html/sitio", "/public_html/sitio/app"]);
    expect(calls.filter((call) => call.url.includes("mkdir")).length).toBe(3);
  });

  it("una carpeta que ya existe no es un error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => (String(url).includes("mkdir") ? Response.json({ cpanelresult: { data: [{ result: 0, reason: "Ya existe esa carpeta (exist)" }] } }) : Response.json({ status: 1, data: {} }))),
    );
    expect(await cpanel.deploy(values, secrets, { "a.txt": bytes("x") })).toMatchObject({ ok: true });
  });
});
