import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { buildBundle } from "./export-bundle";

describe("paquete exportado", () => {
  it("lleva el código y los archivos de Docker, y deja fuera lo privado y lo pesado", async () => {
    const files = Object.keys(unzipSync(await buildBundle("docker", null)));

    expect(files).toEqual(expect.arrayContaining(["package.json", "app/page.tsx", "Dockerfile", "docker-compose.yml", "README.md"]));
    expect(files.some((name) => name.includes("node_modules/"))).toBe(false);
    expect(files.some((name) => name.startsWith(".next/"))).toBe(false);
    expect(files).not.toContain(".env.local");
  }, 60_000);

  it("el ZIP sencillo no lleva Docker", async () => {
    const files = Object.keys(unzipSync(await buildBundle("zip", null)));
    expect(files).toContain("app/page.tsx");
    expect(files).not.toContain("Dockerfile");
  }, 60_000);
});

describe("el sitio dentro del paquete", () => {
  it("va como código que se compila, nunca como un archivo de datos", async () => {
    const zip = unzipSync(await buildBundle("docker", JSON.stringify({ pages: [{ id: "inicio" }] })));
    const names = Object.keys(zip);
    expect(names.some((name) => name.endsWith("published-site.json") || name.startsWith(".cms-data"))).toBe(false);
    const source = new TextDecoder().decode(zip["app/server/exported-site.ts"]);
    expect(source).toContain('export const EXPORTED_SITE: unknown = {"pages":[{"id":"inicio"}]};');
  }, 60_000);

  it("sin nada publicado conserva el archivo vacío", async () => {
    const zip = unzipSync(await buildBundle("zip", null));
    expect(new TextDecoder().decode(zip["app/server/exported-site.ts"])).toContain("EXPORTED_SITE: unknown = null");
  }, 60_000);
});
